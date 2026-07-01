package pt.isel.jagoz.repository.jdbi

import kotlinx.datetime.Instant
import org.jdbi.v3.core.Handle
import pt.isel.jagoz.domain.email.EmailNotificationLog
import pt.isel.jagoz.domain.payment.ChargeType
import pt.isel.jagoz.repository.EmailNotificationLogRepository

class JdbiEmailNotificationLogRepository(
    private val handle: Handle,
) : EmailNotificationLogRepository {
    override fun existsSentSince(
        notificationType: String,
        memberId: Long,
        chargeType: ChargeType,
        season: String,
        month: Int,
        since: Instant,
    ): Boolean =
        handle
            .createQuery(
                """
                SELECT COUNT(*)
                FROM jagoz.email_notification_log
                WHERE notification_type = :notificationType
                  AND member_id = :memberId
                  AND charge_type = CAST(:chargeType AS jagoz.charge_type)
                  AND season = :season
                  AND month = :month
                  AND sent_at >= CAST(:since AS TIMESTAMPTZ)
                """.trimIndent(),
            ).bind("notificationType", notificationType)
            .bind("memberId", memberId)
            .bind("chargeType", chargeType.name)
            .bind("season", season)
            .bind("month", month)
            .bind("since", since.toString())
            .mapTo(Long::class.java)
            .one() > 0

    override fun save(log: EmailNotificationLog): Long =
        handle
            .createUpdate(
                """
                INSERT INTO jagoz.email_notification_log (
                    notification_type, member_id, charge_id, charge_type,
                    season, month, recipient_email, sent_at
                )
                VALUES (
                    :notificationType, :memberId, :chargeId, CAST(:chargeType AS jagoz.charge_type),
                    :season, :month, :recipientEmail, CAST(:sentAt AS TIMESTAMPTZ)
                )
                """.trimIndent(),
            ).bind("notificationType", log.notificationType)
            .bind("memberId", log.memberId)
            .bind("chargeId", log.chargeId)
            .bind("chargeType", log.chargeType.name)
            .bind("season", log.season)
            .bind("month", log.month)
            .bind("recipientEmail", log.recipientEmail)
            .bind("sentAt", log.sentAt.toString())
            .executeAndReturnGeneratedKeys("email_notification_log_id")
            .mapTo(Long::class.java)
            .one()
}
