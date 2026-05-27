package pt.isel.jagoz.service

import com.google.gson.JsonParser
import com.stripe.exception.SignatureVerificationException
import com.stripe.model.Event
import com.stripe.model.checkout.Session
import com.stripe.net.RequestOptions
import com.stripe.net.Webhook
import com.stripe.param.checkout.SessionCreateParams
import jakarta.inject.Named
import kotlinx.datetime.Clock
import kotlinx.datetime.LocalDate
import kotlinx.datetime.TimeZone
import kotlinx.datetime.toLocalDateTime
import pt.isel.jagoz.domain.member.Member
import pt.isel.jagoz.domain.member.MemberStatus
import pt.isel.jagoz.domain.payment.Charge
import pt.isel.jagoz.domain.payment.ChargeItem
import pt.isel.jagoz.domain.payment.ChargeStatus
import pt.isel.jagoz.domain.payment.ChargeType
import pt.isel.jagoz.domain.payment.Payment
import pt.isel.jagoz.domain.payment.PaymentDomain
import pt.isel.jagoz.domain.payment.PaymentError
import pt.isel.jagoz.domain.payment.PaymentStatus
import pt.isel.jagoz.domain.sponsor.Sponsor
import pt.isel.jagoz.domain.sponsor.SponsorDomain
import pt.isel.jagoz.domain.sponsor.SponsorshipStatus
import pt.isel.jagoz.domain.user.AuthenticatedUser
import pt.isel.jagoz.domain.user.canManageBackoffice
import pt.isel.jagoz.domain.utils.Either
import pt.isel.jagoz.domain.utils.ValidationError
import pt.isel.jagoz.domain.utils.failure
import pt.isel.jagoz.domain.utils.success
import pt.isel.jagoz.repository.Transaction
import pt.isel.jagoz.repository.TransactionManager

data class StripeProperties(
    val secretKey: String,
    val webhookSecret: String,
    val apiVersion: String,
    val publicUrl: String,
)

data class CheckoutSessionResult(
    val paymentId: Long,
    val chargeId: Long,
    val sessionId: String,
    val checkoutUrl: String,
)

data class MembershipFeeSelection(
    val season: String,
    val month: Int,
)

data class MembershipFeeOption(
    val season: String,
    val month: Int,
    val amount: Int,
    val dueDate: LocalDate,
    val status: ChargeStatus?,
    val selectable: Boolean,
    val receiptPaymentId: Long?,
)

data class ReceiptLine(
    val description: String,
    val amount: Int,
)

data class PaymentReceipt(
    val receiptNumber: String,
    val paymentId: Long,
    val chargeId: Long,
    val type: ChargeType,
    val payerName: String,
    val payerNif: String?,
    val paidAt: String,
    val amount: Int,
    val provider: String,
    val providerRef: String?,
    val lines: List<ReceiptLine>,
)

typealias CheckoutSessionCreationResult = Either<PaymentError, CheckoutSessionResult>
typealias StripeWebhookResult = Either<PaymentError, Unit>
typealias MembershipFeeOptionsResult = Either<PaymentError, List<MembershipFeeOption>>
typealias PaymentReceiptResult = Either<PaymentError, PaymentReceipt>

@Named
class PaymentService(
    private val transactionManager: TransactionManager,
    private val paymentDomain: PaymentDomain,
    private val sponsorDomain: SponsorDomain,
    private val stripeProperties: StripeProperties,
) {
    private val requestOptions: RequestOptions =
        RequestOptions
            .builder()
            .setApiKey(stripeProperties.secretKey)
            .build()

    fun createCheckoutSession(
        authenticatedUser: AuthenticatedUser,
        chargeId: Long?,
        sponsorshipId: Long?,
        memberId: Long?,
        membershipFees: List<MembershipFeeSelection>?,
    ): CheckoutSessionCreationResult =
        transactionManager.run { transaction ->
            val chargeItems = mutableListOf<ChargeItem>()
            val charge =
                when {
                    chargeId != null ->
                        transaction.chargeRepository.findById(chargeId)
                            ?: return@run failure(PaymentError.DomainError("Charge $chargeId not found"))

                    sponsorshipId != null ->
                        when (val result = getOrCreateSponsorshipCharge(transaction, authenticatedUser, sponsorshipId)) {
                            is Either.Left -> return@run failure(result.value)
                            is Either.Right -> result.value
                        }

                    memberId != null ->
                        when (val result = createMembershipFeeCharge(transaction, authenticatedUser, memberId, membershipFees.orEmpty())) {
                            is Either.Left -> return@run failure(result.value)
                            is Either.Right -> {
                                chargeItems.addAll(transaction.chargeItemRepository.findByChargeId(result.value.chargeId))
                                result.value
                            }
                        }

                    else -> return@run failure(PaymentError.Validation("chargeId, sponsorshipId or memberId is required"))
                }

            if (!canPayCharge(authenticatedUser, charge)) {
                return@run failure(PaymentError.DomainError("Not authorized"))
            }

            if (charge.status != ChargeStatus.PENDING) {
                return@run failure(PaymentError.InvalidOperation("Charge is not pending"))
            }

            if (chargeItems.isEmpty()) {
                chargeItems.addAll(transaction.chargeItemRepository.findByChargeId(charge.chargeId))
            }

            transaction.paymentRepository
                .findByChargeId(charge.chargeId)
                .firstOrNull { it.status == PaymentStatus.PENDING }
                ?.let { pendingPayment ->
                    val pendingSession =
                        runCatching { Session.retrieve(pendingPayment.providerRef, requestOptions) }
                            .getOrNull()

                    if (pendingSession?.status == "open" && pendingSession.url != null) {
                        return@run success(
                            CheckoutSessionResult(
                                paymentId = pendingPayment.paymentId,
                                chargeId = charge.chargeId,
                                sessionId = pendingSession.id,
                                checkoutUrl = pendingSession.url,
                            ),
                        )
                    }
                }

            val session = createStripeSession(charge, chargeItems)
            val now = Clock.System.now()
            val payment =
                Payment(
                    paymentId = 0,
                    chargeId = charge.chargeId,
                    amount = charge.value,
                    provider = STRIPE_PROVIDER,
                    providerRef = session.id,
                    status = PaymentStatus.PENDING,
                    createdAt = now,
                    confirmedAt = null,
                )

            when (val validation = paymentDomain.validatePaymentForCreation(payment)) {
                is Either.Left -> failure(PaymentError.Validation(validationErrorMessage(validation.value)))
                is Either.Right -> {
                    val paymentId = transaction.paymentRepository.save(validation.value)
                    success(
                        CheckoutSessionResult(
                            paymentId = paymentId,
                            chargeId = charge.chargeId,
                            sessionId = session.id,
                            checkoutUrl =
                                session.url
                                    ?: return@run failure(PaymentError.DomainError("Stripe did not return a checkout URL")),
                        ),
                    )
                }
            }
        }

    fun getMembershipFeeOptions(
        authenticatedUser: AuthenticatedUser,
        memberId: Long,
    ): MembershipFeeOptionsResult =
        transactionManager.run { transaction ->
            val member =
                transaction.memberRepository.findById(memberId)
                    ?: return@run failure(PaymentError.DomainError("Member $memberId not found"))

            if (!canPayMember(authenticatedUser, member)) {
                return@run failure(PaymentError.DomainError("Not authorized"))
            }

            success(buildMembershipFeeOptions(member, transaction))
        }

    fun markMembershipFeesPaid(
        authenticatedUser: AuthenticatedUser,
        memberId: Long,
        membershipFees: List<MembershipFeeSelection>,
    ): MembershipFeeOptionsResult {
        if (!authenticatedUser.canManageBackoffice()) {
            return failure(PaymentError.DomainError("Not authorized"))
        }

        return transactionManager.run { transaction ->
            val charge =
                when (val result = createMembershipFeeCharge(transaction, authenticatedUser, memberId, membershipFees)) {
                    is Either.Left -> return@run failure(result.value)
                    is Either.Right -> result.value
                }

            val now = Clock.System.now()
            val paidAt = now.toLocalDateTime(TimeZone.currentSystemDefault()).date
            val paidCharge =
                when (val result = paymentDomain.markChargePaid(charge, paidAt)) {
                    is Either.Left -> return@run failure(PaymentError.InvalidOperation(result.value.toString()))
                    is Either.Right -> result.value
                }
            transaction.chargeRepository.update(paidCharge)

            transaction.paymentRepository.save(
                Payment(
                    paymentId = 0,
                    chargeId = paidCharge.chargeId,
                    amount = paidCharge.value,
                    provider = "MANUAL",
                    providerRef = null,
                    status = PaymentStatus.PAID,
                    createdAt = now,
                    confirmedAt = now,
                ),
            )

            val member =
                transaction.memberRepository.findById(memberId)
                    ?: return@run failure(PaymentError.DomainError("Member $memberId not found"))
            success(buildMembershipFeeOptions(member, transaction))
        }
    }

    fun getReceipt(
        authenticatedUser: AuthenticatedUser,
        paymentId: Long,
    ): PaymentReceiptResult =
        transactionManager.run { transaction ->
            val payment =
                transaction.paymentRepository.findById(paymentId)
                    ?: return@run failure(PaymentError.DomainError("Payment $paymentId not found"))
            buildReceipt(transaction, authenticatedUser, payment)
        }

    fun getSponsorshipReceipt(
        authenticatedUser: AuthenticatedUser,
        sponsorshipId: Long,
    ): PaymentReceiptResult =
        transactionManager.run { transaction ->
            val payment = transaction.paymentRepository.findPaidBySponsorshipId(sponsorshipId)
            if (payment != null) {
                return@run buildReceipt(transaction, authenticatedUser, payment)
            }

            val sponsorship =
                transaction.sponsorshipRepository.findById(sponsorshipId)
                    ?: return@run failure(PaymentError.DomainError("Sponsorship $sponsorshipId not found"))
            val sponsor =
                transaction.sponsorRepository.findById(sponsorship.sponsorId)
                    ?: return@run failure(PaymentError.DomainError("Sponsor ${sponsorship.sponsorId} not found"))

            if (!canPaySponsorship(authenticatedUser, sponsor)) {
                return@run failure(PaymentError.DomainError("Not authorized"))
            }

            if (sponsorship.status != SponsorshipStatus.PAGO && sponsorship.status != SponsorshipStatus.ATIVO) {
                return@run failure(PaymentError.InvalidOperation("Sponsorship is not paid"))
            }

            success(
                PaymentReceipt(
                    receiptNumber = "REC-SP-${sponsorship.sponsorshipId.toString().padStart(6, '0')}",
                    paymentId = 0,
                    chargeId = 0,
                    type = ChargeType.SPONSORSHIP_FEE,
                    payerName = sponsor.name,
                    payerNif = sponsor.nif,
                    paidAt =
                        Clock.System
                            .now()
                            .toLocalDateTime(TimeZone.currentSystemDefault())
                            .date
                            .toString(),
                    amount = sponsorship.price,
                    provider = "MANUAL",
                    providerRef = null,
                    lines = listOf(ReceiptLine(description = "Patrocinio ${sponsorship.season}", amount = sponsorship.price)),
                ),
            )
        }

    fun handleStripeWebhook(
        payload: String,
        signature: String,
    ): StripeWebhookResult {
        val event =
            try {
                Webhook.constructEvent(payload, signature, stripeProperties.webhookSecret)
            } catch (error: SignatureVerificationException) {
                return failure(PaymentError.DomainError("Invalid Stripe webhook signature"))
            } catch (error: Exception) {
                return failure(PaymentError.DomainError("Invalid Stripe webhook payload"))
            }

        return when (event.type) {
            "checkout.session.completed",
            "checkout.session.async_payment_succeeded",
            -> handleCheckoutSessionPaid(checkoutSessionId(event))

            "checkout.session.async_payment_failed",
            "checkout.session.expired",
            -> handleCheckoutSessionFailed(checkoutSessionId(event))

            else -> success(Unit)
        }
    }

    private fun createStripeSession(
        charge: Charge,
        chargeItems: List<ChargeItem>,
    ): Session {
        val appUrl = stripeProperties.publicUrl.trimEnd('/')
        val builder =
            SessionCreateParams
                .builder()
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .setSuccessUrl("$appUrl/payments/success?session_id={CHECKOUT_SESSION_ID}")
                .setCancelUrl("$appUrl/payments/cancel")
                .setCustomerEmail(charge.chargeUser?.email)
                .putMetadata("chargeId", charge.chargeId.toString())
                .putMetadata("chargeType", charge.type.name)

        if (chargeItems.isEmpty()) {
            builder
                .addLineItem(
                    SessionCreateParams.LineItem
                        .builder()
                        .setQuantity(1)
                        .setPriceData(
                            SessionCreateParams.LineItem.PriceData
                                .builder()
                                .setCurrency("eur")
                                .setUnitAmount(charge.value.toLong())
                                .setProductData(
                                    SessionCreateParams.LineItem.PriceData.ProductData
                                        .builder()
                                        .setName(chargeProductName(charge))
                                        .build(),
                                ).build(),
                        ).build(),
                )
        } else {
            chargeItems.forEach { item ->
                builder.addLineItem(
                    SessionCreateParams.LineItem
                        .builder()
                        .setQuantity(1)
                        .setPriceData(
                            SessionCreateParams.LineItem.PriceData
                                .builder()
                                .setCurrency("eur")
                                .setUnitAmount(item.amount.toLong())
                                .setProductData(
                                    SessionCreateParams.LineItem.PriceData.ProductData
                                        .builder()
                                        .setName(item.description)
                                        .build(),
                                ).build(),
                        ).build(),
                )
            }
        }

        return Session.create(builder.build(), requestOptions)
    }

    private fun handleCheckoutSessionPaid(sessionId: String?): StripeWebhookResult {
        val stripeSessionId = sessionId ?: return failure(PaymentError.DomainError("Stripe session missing"))
        return transactionManager.run { transaction ->
            val payment =
                transaction.paymentRepository.findByProviderRef(STRIPE_PROVIDER, stripeSessionId)
                    ?: return@run failure(PaymentError.DomainError("Payment for Stripe session $stripeSessionId not found"))

            if (payment.status == PaymentStatus.PAID) {
                return@run success(Unit)
            }

            val charge =
                transaction.chargeRepository.findById(payment.chargeId)
                    ?: return@run failure(PaymentError.DomainError("Charge ${payment.chargeId} not found"))

            val confirmedAt = Clock.System.now()
            when (val confirmedPayment = paymentDomain.confirmPayment(payment, confirmedAt)) {
                is Either.Left -> return@run failure(confirmedPayment.value)
                is Either.Right -> transaction.paymentRepository.update(confirmedPayment.value)
            }

            if (charge.status == ChargeStatus.PENDING) {
                val paidAt = confirmedAt.toLocalDateTime(TimeZone.currentSystemDefault()).date
                when (val paidCharge = paymentDomain.markChargePaid(charge, paidAt)) {
                    is Either.Left -> return@run failure(PaymentError.DomainError(paidCharge.value.toString()))
                    is Either.Right -> transaction.chargeRepository.update(paidCharge.value)
                }
            }

            charge.sponsorshipId?.let { sponsorshipId ->
                val sponsorship =
                    transaction.sponsorshipRepository.findById(sponsorshipId)
                        ?: return@run failure(PaymentError.DomainError("Sponsorship $sponsorshipId not found"))
                if (sponsorship.status != SponsorshipStatus.PAGO) {
                    when (val paidSponsorship = sponsorDomain.markPaid(sponsorship)) {
                        is Either.Left -> return@run failure(PaymentError.DomainError(paidSponsorship.value.toString()))
                        is Either.Right -> transaction.sponsorshipRepository.update(paidSponsorship.value)
                    }
                }
            }

            success(Unit)
        }
    }

    private fun handleCheckoutSessionFailed(sessionId: String?): StripeWebhookResult {
        val stripeSessionId = sessionId ?: return failure(PaymentError.DomainError("Stripe session missing"))
        return transactionManager.run { transaction ->
            val payment =
                transaction.paymentRepository.findByProviderRef(STRIPE_PROVIDER, stripeSessionId)
                    ?: return@run success(Unit)

            if (payment.status == PaymentStatus.PENDING) {
                when (val failed = paymentDomain.failPayment(payment)) {
                    is Either.Left -> return@run failure(failed.value)
                    is Either.Right -> transaction.paymentRepository.update(failed.value)
                }
            }

            success(Unit)
        }
    }

    private fun canPayCharge(
        authenticatedUser: AuthenticatedUser,
        charge: Charge,
    ): Boolean {
        if (authenticatedUser.canManageBackoffice()) {
            return true
        }

        return charge.chargeUser?.userId == authenticatedUser.userId ||
            (charge.memberId != null && charge.memberId == authenticatedUser.activeMemberId)
    }

    private fun canPayMember(
        authenticatedUser: AuthenticatedUser,
        member: Member,
    ): Boolean =
        authenticatedUser.canManageBackoffice() ||
            member.userId == authenticatedUser.userId ||
            member.memberId == authenticatedUser.activeMemberId

    private fun createMembershipFeeCharge(
        transaction: Transaction,
        authenticatedUser: AuthenticatedUser,
        memberId: Long,
        selections: List<MembershipFeeSelection>,
    ): Either<PaymentError, Charge> {
        if (selections.isEmpty()) {
            return failure(PaymentError.Validation("At least one membership fee must be selected"))
        }

        val member =
            transaction.memberRepository.findById(memberId)
                ?: return failure(PaymentError.DomainError("Member $memberId not found"))

        if (!canPayMember(authenticatedUser, member)) {
            return failure(PaymentError.DomainError("Not authorized"))
        }

        if (member.status != MemberStatus.ATIVO) {
            return failure(PaymentError.InvalidOperation("Member must be active before payment"))
        }

        if (member.membershipQuota <= 0) {
            return failure(PaymentError.InvalidOperation("Member does not have membership fees to pay"))
        }

        val uniqueSelections = selections.distinct()
        val selectedFeeKeys = uniqueSelections.map { feeKey(it.season, it.month) }.toSet()
        uniqueSelections.forEach { selection ->
            if (selection.month !in 1..12) {
                return failure(PaymentError.Validation("Month must be between 1 and 12"))
            }
        }

        val existingItems =
            transaction.chargeItemRepository
                .findWithStatusByMember(member.memberId)
                .filter { feeKey(it.item.season, it.item.month) in selectedFeeKeys }

        existingItems.firstOrNull { it.chargeStatus == ChargeStatus.PAID }?.let {
            return failure(PaymentError.InvalidOperation("Membership fee ${it.item.season}/${it.item.month} is already paid"))
        }

        val pendingItems = existingItems.filter { it.chargeStatus == ChargeStatus.PENDING }
        if (pendingItems.isNotEmpty()) {
            val pendingChargeIds = pendingItems.map { it.item.chargeId }.distinct()
            if (pendingChargeIds.size != 1) {
                return failure(PaymentError.InvalidOperation("Selected membership fees belong to multiple pending payments"))
            }

            val pendingChargeId = pendingChargeIds.single()
            val pendingCharge =
                transaction.chargeRepository.findById(pendingChargeId)
                    ?: return failure(PaymentError.DomainError("Charge $pendingChargeId not found"))
            val pendingChargeItems = transaction.chargeItemRepository.findByChargeId(pendingChargeId)
            val pendingFeeKeys = pendingChargeItems.map { feeKey(it.season, it.month) }.toSet()

            if (selectedFeeKeys != pendingFeeKeys) {
                return failure(PaymentError.InvalidOperation("Select all membership fees from the pending payment"))
            }

            return success(pendingCharge)
        }

        val creationUser =
            transaction.userRepository.findById(authenticatedUser.userId)
                ?: return failure(PaymentError.DomainError("User ${authenticatedUser.userId} not found"))
        val chargedUser = member.userId?.let { transaction.userRepository.findById(it) }
        val total = uniqueSelections.sumOf { member.membershipQuota }
        val charge =
            Charge(
                chargeId = 0,
                type = ChargeType.MEMBER_FEE,
                memberId = member.memberId,
                sponsorshipId = null,
                value = total,
                status = ChargeStatus.PENDING,
                season = uniqueSelections.singleOrNull()?.season,
                month = uniqueSelections.singleOrNull()?.month,
                createdAt =
                    Clock.System
                        .now()
                        .toLocalDateTime(TimeZone.currentSystemDefault())
                        .date,
                creationUser = creationUser,
                chargeUser = chargedUser,
                paidAt = null,
            )

        val chargeId = transaction.chargeRepository.save(charge)
        uniqueSelections.forEach { selection ->
            transaction.chargeItemRepository.save(
                ChargeItem(
                    chargeItemId = 0,
                    chargeId = chargeId,
                    season = selection.season,
                    month = selection.month,
                    amount = member.membershipQuota,
                    description = "Quota ${monthLabel(selection.month)} ${selection.season}",
                ),
            )
        }

        return success(charge.copy(chargeId = chargeId))
    }

    private fun getOrCreateSponsorshipCharge(
        transaction: Transaction,
        authenticatedUser: AuthenticatedUser,
        sponsorshipId: Long,
    ): Either<PaymentError, Charge> {
        val sponsorship =
            transaction.sponsorshipRepository.findById(sponsorshipId)
                ?: return failure(PaymentError.DomainError("Sponsorship $sponsorshipId not found"))

        if (sponsorship.status != SponsorshipStatus.APROVADO) {
            return failure(PaymentError.InvalidOperation("Sponsorship must be approved before payment"))
        }

        val sponsor =
            transaction.sponsorRepository.findById(sponsorship.sponsorId)
                ?: return failure(PaymentError.DomainError("Sponsor ${sponsorship.sponsorId} not found"))

        if (!canPaySponsorship(authenticatedUser, sponsor)) {
            return failure(PaymentError.DomainError("Not authorized"))
        }

        transaction.chargeRepository.findPendingBySponsorship(sponsorshipId)?.let { return success(it) }

        val creationUser =
            transaction.userRepository.findById(authenticatedUser.userId)
                ?: return failure(PaymentError.DomainError("User ${authenticatedUser.userId} not found"))
        val chargedUser = sponsor.userId?.let { transaction.userRepository.findById(it) }

        val charge =
            Charge(
                chargeId = 0,
                type = ChargeType.SPONSORSHIP_FEE,
                memberId = null,
                sponsorshipId = sponsorship.sponsorshipId,
                value = sponsorship.price,
                status = ChargeStatus.PENDING,
                season = sponsorship.season,
                month = null,
                createdAt =
                    Clock.System
                        .now()
                        .toLocalDateTime(TimeZone.currentSystemDefault())
                        .date,
                creationUser = creationUser,
                chargeUser = chargedUser,
                paidAt = null,
            )

        val chargeId = transaction.chargeRepository.save(charge)
        return success(charge.copy(chargeId = chargeId))
    }

    private fun canPaySponsorship(
        authenticatedUser: AuthenticatedUser,
        sponsor: Sponsor,
    ): Boolean =
        authenticatedUser.canManageBackoffice() ||
            sponsor.userId == authenticatedUser.userId ||
            sponsor.email.equals(authenticatedUser.email, ignoreCase = true)

    private fun chargeProductName(charge: Charge): String =
        when (charge.type) {
            ChargeType.MEMBER_FEE -> "Quota de sócio"
            ChargeType.ATHLETE_MONTHLY_FEE -> "Mensalidade de atleta"
            ChargeType.SPONSORSHIP_FEE -> "Patrocínio"
        }

    private fun buildMembershipFeeOptions(
        member: Member,
        transaction: Transaction,
    ): List<MembershipFeeOption> {
        if (member.membershipQuota <= 0 || member.status != MemberStatus.ATIVO) {
            return emptyList()
        }

        val today =
            Clock.System
                .now()
                .toLocalDateTime(TimeZone.currentSystemDefault())
                .date
        val startDate = member.approvalDate ?: member.registrationDate
        val start = YearMonth(startDate.year, startDate.monthNumber)
        val end = addMonths(YearMonth(today.year, today.monthNumber), 6)
        val itemByFee =
            transaction.chargeItemRepository
                .findWithStatusByMember(member.memberId)
                .associateBy { "${it.item.season}-${it.item.month}" }

        return generateSequence(start) { current ->
            val next = addMonths(current, 1)
            if (compareYearMonth(next, end) <= 0) next else null
        }.map { yearMonth ->
            val season = seasonFor(yearMonth.year, yearMonth.month)
            val existingItem = itemByFee["$season-${yearMonth.month}"]
            MembershipFeeOption(
                season = season,
                month = yearMonth.month,
                amount = existingItem?.item?.amount ?: member.membershipQuota,
                dueDate = LocalDate(yearMonth.year, yearMonth.month, 8),
                status = existingItem?.chargeStatus,
                selectable = existingItem == null || existingItem.chargeStatus != ChargeStatus.PAID,
                receiptPaymentId = existingItem?.paymentId,
            )
        }.toList()
    }

    private fun feeKey(
        season: String,
        month: Int,
    ): String = "$season-$month"

    private fun buildReceipt(
        transaction: Transaction,
        authenticatedUser: AuthenticatedUser,
        payment: Payment,
    ): PaymentReceiptResult {
        if (payment.status != PaymentStatus.PAID) {
            return failure(PaymentError.InvalidOperation("Payment is not paid"))
        }

        val charge =
            transaction.chargeRepository.findById(payment.chargeId)
                ?: return failure(PaymentError.DomainError("Charge ${payment.chargeId} not found"))

        if (!canViewReceipt(transaction, authenticatedUser, charge)) {
            return failure(PaymentError.DomainError("Not authorized"))
        }

        val member = charge.memberId?.let { transaction.memberRepository.findById(it) }
        val sponsorship = charge.sponsorshipId?.let { transaction.sponsorshipRepository.findById(it) }
        val sponsor = sponsorship?.let { transaction.sponsorRepository.findById(it.sponsorId) }
        val items = transaction.chargeItemRepository.findByChargeId(charge.chargeId)
        val lines =
            if (items.isEmpty()) {
                listOf(ReceiptLine(description = chargeProductName(charge), amount = charge.value))
            } else {
                items.map { ReceiptLine(description = it.description, amount = it.amount) }
            }

        val paidAt =
            payment.confirmedAt
                ?.toLocalDateTime(TimeZone.currentSystemDefault())
                ?.date
                ?.toString()
                ?: charge.paidAt?.toString()
                ?: payment.createdAt.toLocalDateTime(TimeZone.currentSystemDefault()).date.toString()

        return success(
            PaymentReceipt(
                receiptNumber = "REC-${payment.paymentId.toString().padStart(6, '0')}",
                paymentId = payment.paymentId,
                chargeId = charge.chargeId,
                type = charge.type,
                payerName = member?.completeName ?: sponsor?.name ?: charge.chargeUser?.username ?: charge.chargeUser?.email ?: "Cliente",
                payerNif = member?.nif ?: sponsor?.nif,
                paidAt = paidAt,
                amount = payment.amount,
                provider = payment.provider,
                providerRef = payment.providerRef,
                lines = lines,
            ),
        )
    }

    private fun canViewReceipt(
        transaction: Transaction,
        authenticatedUser: AuthenticatedUser,
        charge: Charge,
    ): Boolean {
        if (authenticatedUser.canManageBackoffice()) return true

        charge.memberId?.let { memberId ->
            val member = transaction.memberRepository.findById(memberId) ?: return false
            return canPayMember(authenticatedUser, member)
        }

        charge.sponsorshipId?.let { sponsorshipId ->
            val sponsorship = transaction.sponsorshipRepository.findById(sponsorshipId) ?: return false
            val sponsor = transaction.sponsorRepository.findById(sponsorship.sponsorId) ?: return false
            return canPaySponsorship(authenticatedUser, sponsor)
        }

        return canPayCharge(authenticatedUser, charge)
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

    private fun checkoutSessionId(event: Event): String? {
        val session = event.dataObjectDeserializer.getObject().orElse(null) as? Session
        if (session?.id != null) return session.id

        return runCatching {
            JsonParser
                .parseString(event.dataObjectDeserializer.getRawJson())
                .asJsonObject
                .get("id")
                ?.asString
        }.getOrNull()
    }

    private fun validationErrorMessage(error: ValidationError): String =
        when (error) {
            is ValidationError.FieldError -> "${error.field} ${error.message}"
            is ValidationError.GlobalError -> error.message
        }

    private companion object {
        const val STRIPE_PROVIDER = "STRIPE"
    }
}
