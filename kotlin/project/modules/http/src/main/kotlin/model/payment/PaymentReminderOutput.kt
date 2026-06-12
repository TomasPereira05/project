package pt.isel.jagoz.http.model.payment

import pt.isel.jagoz.service.PaymentReminderSummary

data class PaymentReminderOutput(
    val membersScanned: Int,
    val emailsSent: Int,
    val remindersSent: Int,
)

fun PaymentReminderSummary.toOutput(): PaymentReminderOutput =
    PaymentReminderOutput(
        membersScanned = membersScanned,
        emailsSent = emailsSent,
        remindersSent = remindersSent,
    )
