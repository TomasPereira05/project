package pt.isel.jagoz.host.config

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.core.env.Environment
import org.springframework.mail.javamail.JavaMailSender
import org.springframework.mail.javamail.JavaMailSenderImpl
import java.util.Properties

@Configuration
class EmailConfig {
    @Bean
    fun javaMailSender(env: Environment): JavaMailSender {
        // Sem defaults: getRequiredProperty lança IllegalStateException se faltar.
        // Preferimos crash no arranque a credenciais ficcionais em produção.
        val host = env.getRequiredProperty("EMAIL_HOST")
        val port = env.getRequiredProperty("EMAIL_PORT").toInt()
        val username = env.getRequiredProperty("EMAIL_USERNAME")
        val password = env.getRequiredProperty("EMAIL_PASSWORD")

        val mailSender =
            JavaMailSenderImpl().apply {
                this.host = host
                this.port = port
                this.username = username
                this.password = password
                this.protocol = "smtp"
            }

        val props =
            Properties().apply {
                put("mail.transport.protocol", "smtp")
                put("mail.smtp.auth", "true")
                put("mail.smtp.starttls.enable", "true")
                put("mail.smtp.starttls.required", "true")
                put("mail.smtp.ssl.trust", host)
                put("mail.smtp.connectiontimeout", "5000")
                put("mail.smtp.timeout", "5000")
                put("mail.smtp.writetimeout", "5000")
            }
        mailSender.javaMailProperties = props

        return mailSender
    }
}
