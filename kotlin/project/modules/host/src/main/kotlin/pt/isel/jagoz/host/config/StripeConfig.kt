package pt.isel.jagoz.host.config

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.core.env.Environment
import pt.isel.jagoz.service.StripeProperties

@Configuration
class StripeConfig {
    @Bean
    fun stripeProperties(env: Environment): StripeProperties =
        StripeProperties(
            secretKey = env.getRequiredProperty("STRIPE_SECRET_KEY"),
            webhookSecret = env.getRequiredProperty("STRIPE_WEBHOOK_SECRET"),
            apiVersion = env.getProperty("STRIPE_API_VERSION", "2026-02-25.clover"),
            publicUrl = env.getRequiredProperty("APP_PUBLIC_URL"),
        )
}
