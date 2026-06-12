package pt.isel.jagoz.domain.email

import kotlinx.datetime.Instant
import pt.isel.jagoz.domain.payment.ChargeType

data class EmailNotificationLog(
    val emailNotificationLogId: Long,
    val notificationType: String,
    val memberId: Long,
    val chargeId: Long?,
    val chargeType: ChargeType,
    val season: String,
    val month: Int,
    val recipientEmail: String,
    val sentAt: Instant,
)
