package pt.isel.jagoz.host.config

import kotlinx.datetime.Clock
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.ComponentScan
import org.springframework.context.annotation.Configuration
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer
import pt.isel.jagoz.user.Sha256TokenEncoder
import pt.isel.jagoz.user.UserDomainConfig
import kotlin.time.Duration.Companion.hours

@Configuration
@ComponentScan(basePackages = ["pt.isel.jagoz"])
class AuthConfig : WebMvcConfigurer {
    @Bean
    fun passwordEncoder() = BCryptPasswordEncoder()

    @Bean
    fun tokenEncoder() = Sha256TokenEncoder()

    @Bean
    fun clock(): Clock = Clock.System

    @Bean
    fun usersDomainConfig() =
        UserDomainConfig(
            tokenSizeInBytes = 256 / 8,
            tokenTtl = 24.hours,
            tokenRollingTtl = 1.hours,
            maxTokensPerUser = 3,
        )
}
