package pt.isel.jagoz.service

import jakarta.inject.Named
import kotlinx.datetime.Clock
import kotlinx.datetime.DateTimeUnit
import kotlinx.datetime.LocalDate
import kotlinx.datetime.TimeZone
import kotlinx.datetime.minus
import kotlinx.datetime.toLocalDateTime
import pt.isel.jagoz.domain.email.EmailNotificationLog
import pt.isel.jagoz.domain.member.Member
import pt.isel.jagoz.domain.member.MemberCategory
import pt.isel.jagoz.domain.member.MemberStatus
import pt.isel.jagoz.domain.payment.ChargeStatus
import pt.isel.jagoz.domain.payment.ChargeType
import pt.isel.jagoz.domain.user.AuthenticatedUser
import pt.isel.jagoz.domain.user.canManageBackoffice
import pt.isel.jagoz.domain.utils.Either
import pt.isel.jagoz.domain.utils.failure
import pt.isel.jagoz.domain.utils.success
import pt.isel.jagoz.repository.Transaction
import pt.isel.jagoz.repository.TransactionManager
import pt.isel.jagoz.service.email.EmailService

data class PaymentReminderSummary(
    val membersScanned: Int,
    val emailsSent: Int,
    val remindersSent: Int,
)

typealias PaymentReminderResult = Either<PaymentReminderError, PaymentReminderSummary>

sealed class PaymentReminderError {
    data class DomainError(
        val message: String,
    ) : PaymentReminderError()
}

private data class OverdueReminderLine(
    val chargeId: Long?,
    val chargeType: ChargeType,
    val season: String,
    val month: Int,
    val amount: Int,
    val dueDate: LocalDate,
    val description: String,
)

private data class MemberOverdueReminder(
    val member: Member,
    val lines: List<OverdueReminderLine>,
)

@Named
class PaymentReminderService(
    private val transactionManager: TransactionManager,
    private val emailService: EmailService,
    private val stripeProperties: StripeProperties,
) {
    fun sendOverduePaymentReminders(authenticatedUser: AuthenticatedUser): PaymentReminderResult {
        if (!authenticatedUser.canManageBackoffice()) {
            return failure(PaymentReminderError.DomainError("Not authorized"))
        }

        return success(sendOverduePaymentReminders())
    }

    fun sendOverduePaymentReminders(): PaymentReminderSummary {
        val now = Clock.System.now()
        val today = now.toLocalDateTime(TimeZone.of("Europe/Lisbon")).date
        val reminderWindowStart = now.minus(REMINDER_INTERVAL_DAYS, DateTimeUnit.DAY, TimeZone.UTC)

        val reminders =
            transactionManager.run { transaction ->
                val activeMembers = transaction.memberRepository.findAllActive()
                val memberReminders =
                    activeMembers.mapNotNull { member ->
                        val lines =

                            overdueLinesFor(member, transaction, today)
                                .filterNot { line ->
                                    transaction.emailNotificationLogRepository.existsSentSince(
                                        notificationType = NOTIFICATION_TYPE,
                                        memberId = member.memberId,
                                        chargeType = line.chargeType,
                                        season = line.season,
                                        month = line.month,
                                        since = reminderWindowStart,
                                    )
                                }

                        if (lines.isEmpty()) null else MemberOverdueReminder(member, lines)
                    }
                activeMembers.size to memberReminders
            }

        var emailsSent = 0
        var remindersSent = 0

        reminders.second.forEach { reminder ->
            val member = reminder.member
            val lines = reminder.lines

            emailService.sendOverduePaymentReminderEmail(
                memberName = member.completeName,
                memberEmail = member.email,
                paymentUrl = "${stripeProperties.publicUrl.trimEnd('/')}/members/${member.memberId}",
                lines =
                    lines.map {
                        EmailService.OverduePaymentEmailLine(
                            label = reminderLabel(it.chargeType),
                            description = it.description,
                            season = it.season,
                            month = monthLabel(it.month),
                            dueDate = it.dueDate.toString(),
                            amountCents = it.amount,
                        )
                    },
            )

            transactionManager.run { transaction ->
                lines.forEach { line ->
                    transaction.emailNotificationLogRepository.save(
                        EmailNotificationLog(
                            emailNotificationLogId = 0,
                            notificationType = NOTIFICATION_TYPE,
                            memberId = member.memberId,
                            chargeId = line.chargeId,
                            chargeType = line.chargeType,
                            season = line.season,
                            month = line.month,
                            recipientEmail = member.email,
                            sentAt = now,
                        ),
                    )
                }
            }

            emailsSent++
            remindersSent += lines.size
        }

        return PaymentReminderSummary(
            membersScanned = reminders.first,
            emailsSent = emailsSent,
            remindersSent = remindersSent,
        )
    }

    private fun overdueLinesFor(
        member: Member,
        transaction: Transaction,
        today: LocalDate,
    ): List<OverdueReminderLine> {
        if (member.status != MemberStatus.ATIVO) return emptyList()

        val existingItems =
            transaction.chargeItemRepository
                .findWithStatusByMember(member.memberId)
                .associateBy { feeKey(it.item.season, it.item.month, it.chargeType) }

        val generatedMemberFeeLines =
            if (member.category == MemberCategory.SOCIO && member.membershipQuota > 0) {
                generateMemberFeeMonths(member, today).mapNotNull { yearMonth ->
                    val season = seasonFor(yearMonth.year, yearMonth.month)
                    val dueDate = LocalDate(yearMonth.year, yearMonth.month, DUE_DAY)
                    if (dueDate >= today) return@mapNotNull null

                    val existing = existingItems[feeKey(season, yearMonth.month, ChargeType.MEMBER_FEE)]
                    when (existing?.chargeStatus) {
                        ChargeStatus.PAID -> {
                            null
                        }

                        ChargeStatus.PENDING -> {
                            OverdueReminderLine(
                                chargeId = existing.item.chargeId,
                                chargeType = ChargeType.MEMBER_FEE,
                                season = season,
                                month = yearMonth.month,
                                amount = existing.item.amount,
                                dueDate = dueDate,
                                description = existing.item.description,
                            )
                        }

                        else -> {
                            OverdueReminderLine(
                                chargeId = null,
                                chargeType = ChargeType.MEMBER_FEE,
                                season = season,
                                month = yearMonth.month,
                                amount = member.membershipQuota,
                                dueDate = dueDate,
                                description = "Quota ${monthLabel(yearMonth.month)} $season",
                            )
                        }
                    }
                }.toList()
            } else {
                emptyList()
            }

        val existingAthleteMonthlyLines =
            existingItems.values
                .filter { it.chargeType == ChargeType.ATHLETE_MONTHLY_FEE && it.chargeStatus == ChargeStatus.PENDING }
                .mapNotNull { existing ->
                    val yearMonth = yearMonthFor(existing.item.season, existing.item.month) ?: return@mapNotNull null
                    val dueDate = LocalDate(yearMonth.year, yearMonth.month, DUE_DAY)
                    if (dueDate >= today) return@mapNotNull null
                    OverdueReminderLine(
                        chargeId = existing.item.chargeId,
                        chargeType = ChargeType.ATHLETE_MONTHLY_FEE,
                        season = existing.item.season,
                        month = existing.item.month,
                        amount = existing.item.amount,
                        dueDate = dueDate,
                        description = existing.item.description,
                    )
                }

        return (generatedMemberFeeLines + existingAthleteMonthlyLines)
            .sortedWith(compareBy<OverdueReminderLine> { it.dueDate }.thenBy { it.chargeType.name })
    }

    private fun generateMemberFeeMonths(
        member: Member,
        today: LocalDate,
    ): Sequence<YearMonth> {
        val startDate = member.approvalDate ?: member.registrationDate
        val start = YearMonth(startDate.year, startDate.monthNumber)
        val end = YearMonth(today.year, today.monthNumber)
        return generateSequence(start) { current ->
            val next = addMonths(current, 1)
            if (compareYearMonth(next, end) <= 0) next else null
        }
    }

    private fun feeKey(
        season: String,
        month: Int,
        chargeType: ChargeType,
    ): String = "$chargeType-$season-$month"

    private fun yearMonthFor(
        season: String,
        month: Int,
    ): YearMonth? {
        if (month !in 1..12) return null
        val parts = season.split("/")
        val startYear = parts.getOrNull(0)?.toIntOrNull() ?: return null
        val endYear = parts.getOrNull(1)?.toIntOrNull() ?: return null
        return YearMonth(if (month >= 8) startYear else endYear, month)
    }

    private data class YearMonth(
        val year: Int,
        val month: Int,
    )

    private fun addMonths(
        yearMonth: YearMonth,
        months: Int,
    ): YearMonth {
        val zeroBased = yearMonth.year * 12 + (yearMonth.month - 1) + months
        return YearMonth(year = zeroBased / 12, month = zeroBased % 12 + 1)
    }

    private fun compareYearMonth(
        left: YearMonth,
        right: YearMonth,
    ): Int = (left.year * 12 + left.month).compareTo(right.year * 12 + right.month)

    private fun seasonFor(
        year: Int,
        month: Int,
    ): String =
        if (month >= 8) {
            "$year/${year + 1}"
        } else {
            "${year - 1}/$year"
        }

    private fun reminderLabel(chargeType: ChargeType): String =
        when (chargeType) {
            ChargeType.MEMBER_FEE -> "Quota de socio"
            ChargeType.ATHLETE_MONTHLY_FEE -> "Mensalidade de atleta"
            ChargeType.SPONSORSHIP_FEE -> "Patrocinio"
            ChargeType.TICKET_PURCHASE -> "Bilhete"
        }

    private fun monthLabel(month: Int): String =
        when (month) {
            1 -> "Janeiro"
            2 -> "Fevereiro"
            3 -> "Marco"
            4 -> "Abril"
            5 -> "Maio"
            6 -> "Junho"
            7 -> "Julho"
            8 -> "Agosto"
            9 -> "Setembro"
            10 -> "Outubro"
            11 -> "Novembro"
            12 -> "Dezembro"
            else -> month.toString()
        }

    private companion object {
        const val NOTIFICATION_TYPE = "OVERDUE_PAYMENT_REMINDER"
        const val REMINDER_INTERVAL_DAYS = 7
        const val DUE_DAY = 8
    }
}
