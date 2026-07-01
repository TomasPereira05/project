package pt.isel.jagoz.repository

import kotlinx.datetime.Instant
import pt.isel.jagoz.domain.email.EmailNotificationLog
import pt.isel.jagoz.domain.payment.ChargeType

interface EmailNotificationLogRepository {
    fun existsSentSince(
        notificationType: String,
        memberId: Long,
        chargeType: ChargeType,
        season: String,
        month: Int,
        since: Instant,
    ): Boolean

    fun save(log: EmailNotificationLog): Long
}
