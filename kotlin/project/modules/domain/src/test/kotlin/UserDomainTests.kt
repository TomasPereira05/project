package pt.isel.jagoz.user

import kotlinx.datetime.Clock
import kotlinx.datetime.Instant
import org.springframework.security.crypto.password.PasswordEncoder
import pt.isel.jagoz.domain.user.PasswordValidationInfo
import pt.isel.jagoz.domain.user.Role
import pt.isel.jagoz.domain.user.Sha256TokenEncoder
import pt.isel.jagoz.domain.user.User
import pt.isel.jagoz.domain.user.UserDomain
import pt.isel.jagoz.domain.user.UserDomainConfig
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertFalse
import kotlin.test.assertTrue
import kotlin.time.Duration.Companion.seconds

class UserDomainTests {
    private class FakePasswordEncoder : PasswordEncoder {
        override fun encode(rawPassword: CharSequence?): String = "ENC:$rawPassword"

        override fun matches(
            rawPassword: CharSequence?,
            encodedPassword: String?,
        ): Boolean = encodedPassword == encode(rawPassword)
    }

    private class FixedClock(private val instant: Instant) : Clock {
        override fun now(): Instant = instant
    }

    @Test
    fun token_generation_and_format_checks() {
        val cfg =
            UserDomainConfig(
                tokenSizeInBytes = 32,
                tokenTtl = 60.seconds,
                tokenRollingTtl = 120.seconds,
                maxTokensPerUser = 5,
            )
        val domain = UserDomain(FakePasswordEncoder(), Sha256TokenEncoder(), cfg)

        val (token, raw) = domain.createToken(1)
        assertEquals(1, token.userId)
        assertTrue(raw.isNotBlank())
        assertTrue(domain.isTokenValidFormat(raw))
        // invalid formats
        assertFalse(domain.isTokenValidFormat(null))
        assertFalse(domain.isTokenValidFormat("bad-token"))
    }

    @Test
    fun token_time_validity_and_expiration() {
        val cfg =
            UserDomainConfig(
                tokenSizeInBytes = 16,
                tokenTtl = 10.seconds,
                tokenRollingTtl = 20.seconds,
                maxTokensPerUser = 3,
            )
        val domain = UserDomain(FakePasswordEncoder(), Sha256TokenEncoder(), cfg)
        val (token, raw) = domain.createToken(2)

        // now within TTL
        val within = FixedClock(token.createdAt + 5.seconds)
        assertTrue(domain.isTokenTimeValid(within, token))

        // absolute expiry
        val afterAbs = FixedClock(token.createdAt + 11.seconds)
        assertFalse(domain.isTokenTimeValid(afterAbs, token))

        // rolling expiry: simulate token last used long ago
        val stale = token.copy(lastUsedAt = token.lastUsedAt - 21.seconds)
        val check = FixedClock(token.createdAt + 5.seconds)
        assertFalse(domain.isTokenTimeValid(check, stale))

        // expiration time is min( created+ttl, lastUsed+rolling )
        val earlyRolling = token.copy(lastUsedAt = token.lastUsedAt - 9.seconds)
        val expected = minOf(token.createdAt + cfg.tokenTtl, earlyRolling.lastUsedAt + cfg.tokenRollingTtl)
        assertEquals(expected, domain.getTokenExpiration(earlyRolling))
    }

    @Test
    fun password_encoding_and_validation() {
        val cfg = UserDomainConfig(16, 60.seconds, 60.seconds, 5)
        val domain = UserDomain(FakePasswordEncoder(), Sha256TokenEncoder(), cfg)

        val pwInfo = domain.createPasswordValidationInformation("Secret123")
        val correct = domain.validatePassword("Secret123", pwInfo)
        val wrong = domain.validatePassword("wrong", pwInfo)
        println("pwInfo.validationInfo=${pwInfo.validationInfo}")
        println("domain.encode(Secret123)=${domain.encodePassword("Secret123")}")
        println("domain.encode(wrong)=${domain.encodePassword("wrong")}")
        println("validate correct=$correct")
        println("validate wrong=$wrong")
        assertTrue(correct)
        assertFalse(wrong)

        assertTrue(domain.isSafePassword("Abcdef1g"))
        assertFalse(domain.isSafePassword("short1"))

        assertFailsWith<IllegalArgumentException> {
            domain.createPasswordValidationInformation("")
        }
    }

    @Test
    fun create_authenticated_user_returns_token_and_user() {
        val cfg = UserDomainConfig(24, 60.seconds, 60.seconds, 5)
        val domain = UserDomain(FakePasswordEncoder(), Sha256TokenEncoder(), cfg)

        val user =
            User(
                userId = 7,
                email = "a@b.c",
                username = "u",
                passwordValidation = PasswordValidationInfo("x"),
                role = Role.NORMAL,
            )
        val auth = domain.createAuthenticatedUser(user)
        assertEquals(user, auth.user)
        assertTrue(auth.token.isNotBlank())
    }
}
