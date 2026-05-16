package pt.isel.jagoz.host.email

import jakarta.mail.MessagingException
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.core.io.ByteArrayResource
import org.springframework.mail.MailException
import org.springframework.mail.javamail.JavaMailSender
import org.springframework.mail.javamail.MimeMessageHelper
import org.springframework.stereotype.Component
import pt.isel.jagoz.service.email.EmailDeliveryException
import pt.isel.jagoz.service.email.EmailSender

@Component
class JavaMailEmailSender(
    private val mailSender: JavaMailSender,
    @Value("\${EMAIL_USERNAME}") private val fromEmail: String,
    @Value("\${EMAIL_FROM_NAME}") private val fromName: String,
) : EmailSender {
    companion object {
        private val logger = LoggerFactory.getLogger(JavaMailEmailSender::class.java)
    }

    override fun sendEmail(
        to: String,
        subject: String,
        body: String,
        isHtml: Boolean,
        inlineImages: Map<String, ByteArray>,
        attachments: Map<String, ByteArray>,
    ) {
        try {
            val message = mailSender.createMimeMessage()
            val helper = MimeMessageHelper(message, true, "UTF-8")

            helper.setFrom(fromEmail, fromName)
            helper.setTo(to)
            helper.setSubject(subject)
            helper.setText(body, isHtml)

            inlineImages.forEach { (cid, bytes) ->
                helper.addInline(cid, ByteArrayResource(bytes), "image/png")
            }

            attachments.forEach { (filename, bytes) ->
                helper.addAttachment(filename, ByteArrayResource(bytes))
            }

            mailSender.send(message)
            logger.info("Email sent to {}", to)
        } catch (e: MailException) {
            logger.error("Failed to send email to {}: {}", to, e.message, e)
            throw EmailDeliveryException("Could not send email to $to", e)
        } catch (e: MessagingException) {
            logger.error("Failed to build email to {}: {}", to, e.message, e)
            throw EmailDeliveryException("Could not build email to $to", e)
        }
    }
}
