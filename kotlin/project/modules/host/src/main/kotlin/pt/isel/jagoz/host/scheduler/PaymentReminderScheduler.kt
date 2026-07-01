package pt.isel.jagoz.host.scheduler

import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component
import pt.isel.jagoz.service.PaymentReminderService

@Component
class PaymentReminderScheduler(
    private val paymentReminderService: PaymentReminderService,
    @Value("\${PAYMENT_REMINDER_ENABLED:true}") private val enabled: Boolean,
) {
    @Scheduled(cron = "\${PAYMENT_REMINDER_CRON:0 0 9 * * *}", zone = "Europe/Lisbon")
    fun sendOverduePaymentReminders() {
        if (!enabled) return

        runCatching {
            paymentReminderService.sendOverduePaymentReminders()
        }.onSuccess { summary ->
            logger.info(
                "Overdue payment reminder job completed: scanned={}, emailsSent={}, remindersSent={}",
                summary.membersScanned,
                summary.emailsSent,
                summary.remindersSent,
            )
        }.onFailure { error ->
            logger.error("Overdue payment reminder job failed: {}", error.message, error)
        }
    }

    private companion object {
        private val logger = LoggerFactory.getLogger(PaymentReminderScheduler::class.java)
    }
}
