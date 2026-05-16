package pt.isel.jagoz.service.email

import jakarta.inject.Named
import org.slf4j.LoggerFactory

@Named
class EmailService(
    private val emailSender: EmailSender,
) {
    companion object {
        private val logger = LoggerFactory.getLogger(EmailService::class.java)
    }
}
