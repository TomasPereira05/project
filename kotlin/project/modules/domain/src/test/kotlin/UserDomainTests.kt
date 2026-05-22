package pt.isel.jagoz.user

import kotlinx.datetime.Clock
import kotlinx.datetime.Instant
import org.springframework.security.crypto.password.PasswordEncoder
import pt.isel.jagoz.domain.user.AuthenticatedUser
import pt.isel.jagoz.domain.user.PasswordValidationInfo
import pt.isel.jagoz.domain.user.Role
import pt.isel.jagoz.domain.user.Sha256TokenEncoder
import pt.isel.jagoz.domain.user.User
import pt.isel.jagoz.domain.user.UserDomain
import pt.isel.jagoz.domain.user.UserDomainConfig
import pt.isel.jagoz.domain.user.UserError
import pt.isel.jagoz.domain.user.canManageBackoffice
import pt.isel.jagoz.domain.user.toAuthenticatedUser
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertFalse
import kotlin.test.assertIs
import kotlin.test.assertNotEquals
import kotlin.test.assertNotNull
import kotlin.test.assertTrue
import kotlin.time.Duration.Companion.ZERO
import kotlin.time.Duration.Companion.seconds

class UserDomainTests {
    private class FakePasswordEncoder : PasswordEncoder {
        override fun encode(rawPassword: CharSequence?): String = "ENC:$rawPassword"

        override fun matches(
            rawPassword: CharSequence?,
            encodedPassword: String?,
        ): Boolean = encodedPassword == encode(rawPassword)
    }

    private class FixedClock(
        private val instant: Instant,
    ) : Clock {
        override fun now(): Instant = instant
    }

    private fun newDomain(
        tokenSizeInBytes: Int = 32,
        tokenTtl: Long = 60,
        rolling: Long = 120,
        maxTokens: Int = 5,
    ): UserDomain {
        val cfg =
            UserDomainConfig(
                tokenSizeInBytes = tokenSizeInBytes,
                tokenTtl = tokenTtl.seconds,
                tokenRollingTtl = rolling.seconds,
                maxTokensPerUser = maxTokens,
            )
        return UserDomain(FakePasswordEncoder(), Sha256TokenEncoder(), cfg)
    }

    private fun sampleUser(role: Role = Role.NORMAL) =
        User(
            userId = 7,
            email = "a@b.c",
            username = "u",
            passwordValidation = PasswordValidationInfo("x"),
            role = role,
            activeMemberId = null,
        )

    // ---- UserDomainConfig validation ----

    @Test
    fun `UserDomainConfig accepts valid input`() {
        UserDomainConfig(16, 60.seconds, 60.seconds, 5)
    }

    @Test
    fun `UserDomainConfig rejects zero tokenSizeInBytes`() {
        assertFailsWith<IllegalArgumentException> {
            UserDomainConfig(0, 60.seconds, 60.seconds, 5)
        }
    }

    @Test
    fun `UserDomainConfig rejects negative tokenSizeInBytes`() {
        assertFailsWith<IllegalArgumentException> {
            UserDomainConfig(-1, 60.seconds, 60.seconds, 5)
        }
    }

    @Test
    fun `UserDomainConfig rejects non-positive tokenTtl`() {
        assertFailsWith<IllegalArgumentException> {
            UserDomainConfig(16, ZERO, 60.seconds, 5)
        }
    }

    @Test
    fun `UserDomainConfig rejects non-positive rollingTtl`() {
        assertFailsWith<IllegalArgumentException> {
            UserDomainConfig(16, 60.seconds, ZERO, 5)
        }
    }

    @Test
    fun `UserDomainConfig rejects non-positive maxTokensPerUser`() {
        assertFailsWith<IllegalArgumentException> {
            UserDomainConfig(16, 60.seconds, 60.seconds, 0)
        }
    }

    // ---- token generation / format ----

    @Test
    fun `createToken generates token bound to userId`() {
        val domain = newDomain()
        val (token, raw) = domain.createToken(1)
        assertEquals(1L, token.userId)
        assertTrue(raw.isNotBlank())
        assertTrue(domain.isTokenValidFormat(raw))
    }

    @Test
    fun `createToken rejects non-positive userId`() {
        val domain = newDomain()
        assertFailsWith<IllegalArgumentException> { domain.createToken(0) }
        assertFailsWith<IllegalArgumentException> { domain.createToken(-1) }
    }

    @Test
    fun `createToken yields distinct values on subsequent calls`() {
        val domain = newDomain()
        val (_, raw1) = domain.createToken(1)
        val (_, raw2) = domain.createToken(1)
        assertNotEquals(raw1, raw2)
    }

    @Test
    fun `isTokenValidFormat rejects null and bad tokens`() {
        val domain = newDomain()
        assertFalse(domain.isTokenValidFormat(null))
        assertFalse(domain.isTokenValidFormat(""))
        assertFalse(domain.isTokenValidFormat("   "))
        assertFalse(domain.isTokenValidFormat("bad-token"))
    }

    @Test
    fun `isTokenValidFormat accepts well-formed token`() {
        val domain = newDomain(tokenSizeInBytes = 16)
        val (_, raw) = domain.createToken(1)
        assertTrue(domain.isTokenValidFormat(raw))
    }

    // ---- token time validity ----

    @Test
    fun `isTokenTimeValid true within absolute and rolling TTL`() {
        val domain = newDomain(tokenSizeInBytes = 16, tokenTtl = 10, rolling = 20)
        val (token, _) = domain.createToken(2)
        val within = FixedClock(token.createdAt + 5.seconds)
        assertTrue(domain.isTokenTimeValid(within, token))
    }

    @Test
    fun `isTokenTimeValid false after absolute TTL`() {
        val domain = newDomain(tokenSizeInBytes = 16, tokenTtl = 10, rolling = 20)
        val (token, _) = domain.createToken(2)
        val afterAbs = FixedClock(token.createdAt + 11.seconds)
        assertFalse(domain.isTokenTimeValid(afterAbs, token))
    }

    @Test
    fun `isTokenTimeValid false after rolling expiry`() {
        val domain = newDomain(tokenSizeInBytes = 16, tokenTtl = 100, rolling = 20)
        val (token, _) = domain.createToken(2)
        val stale = token.copy(lastUsedAt = token.lastUsedAt - 21.seconds)
        val check = FixedClock(token.createdAt + 5.seconds)
        assertFalse(domain.isTokenTimeValid(check, stale))
    }

    @Test
    fun `getTokenExpiration is min of absolute and rolling`() {
        val domain = newDomain(tokenSizeInBytes = 16, tokenTtl = 10, rolling = 20)
        val (token, _) = domain.createToken(2)
        val earlyRolling = token.copy(lastUsedAt = token.lastUsedAt - 9.seconds)
        val expected =
            minOf(
                token.createdAt + 10.seconds,
                earlyRolling.lastUsedAt + 20.seconds,
            )
        assertEquals(expected, domain.getTokenExpiration(earlyRolling))
    }

    // ---- password encoding / validation ----

    @Test
    fun `password roundtrip via FakePasswordEncoder`() {
        val domain = newDomain()
        val info = domain.createPasswordValidationInformation("Secret123")
        assertTrue(domain.validatePassword("Secret123", info))
        assertFalse(domain.validatePassword("wrong", info))
    }

    @Test
    fun `createPasswordValidationInformation rejects empty password`() {
        val domain = newDomain()
        assertFailsWith<IllegalArgumentException> {
            domain.createPasswordValidationInformation("")
        }
    }

    @Test
    fun `isSafePassword requires length and complexity`() {
        val domain = newDomain()
        assertTrue(domain.isSafePassword("Abcdef1g"))
        assertFalse(domain.isSafePassword("short1"))
        assertFalse(domain.isSafePassword("longbutnoNumber"))
        assertFalse(domain.isSafePassword("12345678"))
        assertFalse(domain.isSafePassword(""))
    }

    @Test
    fun `encodePassword delegates to PasswordEncoder`() {
        val domain = newDomain()
        assertEquals("ENC:abc", domain.encodePassword("abc"))
    }

    // ---- authenticated user ----

    @Test
    fun `createAuthenticatedUser returns token attached to user`() {
        val domain = newDomain(tokenSizeInBytes = 24)
        val auth = domain.createAuthenticatedUser(sampleUser())
        assertEquals(sampleUser().userId, auth.userId)
        assertEquals(sampleUser().email, auth.email)
        assertEquals(sampleUser().username, auth.username)
        assertEquals(sampleUser().role, auth.role)
        assertTrue(auth.token.isNotBlank())
        assertNotNull(auth.token)
    }

    @Test
    fun `AuthenticatedUser requires non-blank token`() {
        assertFailsWith<IllegalArgumentException> {
            AuthenticatedUser(1, "a@b.c", "u", Role.NORMAL, null, "")
        }
    }

    @Test
    fun `toAuthenticatedUser copies user fields including activeMemberId`() {
        val user = sampleUser(Role.SECRETARIA).copy(activeMemberId = 5)
        val auth = user.toAuthenticatedUser("the-token")
        assertEquals(user.userId, auth.userId)
        assertEquals(user.email, auth.email)
        assertEquals(user.username, auth.username)
        assertEquals(Role.SECRETARIA, auth.role)
        assertEquals(5L, auth.activeMemberId)
        assertEquals("the-token", auth.token)
    }

    // ---- canManageBackoffice ----

    @Test
    fun `canManageBackoffice true for ADMIN`() {
        val auth = sampleUser(Role.ADMIN).toAuthenticatedUser("t")
        assertTrue(auth.canManageBackoffice())
    }

    @Test
    fun `canManageBackoffice true for SECRETARIA`() {
        val auth = sampleUser(Role.SECRETARIA).toAuthenticatedUser("t")
        assertTrue(auth.canManageBackoffice())
    }

    @Test
    fun `canManageBackoffice false for NORMAL`() {
        val auth = sampleUser(Role.NORMAL).toAuthenticatedUser("t")
        assertFalse(auth.canManageBackoffice())
    }

    // ---- createTokenValidationInformation / Sha256TokenEncoder ----

    @Test
    fun `createTokenValidationInformation is deterministic`() {
        val domain = newDomain()
        val a = domain.createTokenValidationInformation("hello")
        val b = domain.createTokenValidationInformation("hello")
        assertEquals(a, b)
    }

    @Test
    fun `createTokenValidationInformation differs for different inputs`() {
        val domain = newDomain()
        val a = domain.createTokenValidationInformation("hello")
        val b = domain.createTokenValidationInformation("world")
        assertNotEquals(a, b)
    }

    @Test
    fun `Sha256TokenEncoder produces url-safe base64`() {
        val encoder = Sha256TokenEncoder()
        val info = encoder.createValidationInformation("abc")
        val urlSafe = Regex("^[A-Za-z0-9_=-]+$")
        assertTrue(urlSafe.matches(info.validationInfo), "Expected url-safe base64 but was '${info.validationInfo}'")
        assertTrue(info.validationInfo.isNotBlank())
    }

    // ---- UserError variants ----

    @Test
    fun `UserError NotFound carries field and value`() {
        val err = UserError.NotFound("email", "x@y.z")
        assertEquals("email", err.field)
        assertEquals("x@y.z", err.value)
    }

    @Test
    fun `UserError AlreadyExists carries field and value`() {
        val err = UserError.AlreadyExists("username", "tomas")
        assertEquals("username", err.field)
        assertEquals("tomas", err.value)
    }

    @Test
    fun `UserError Validation carries message`() {
        val err = UserError.Validation("password too short")
        assertEquals("password too short", err.message)
    }

    @Test
    fun `UserError Unauthorized carries message`() {
        val err = UserError.Unauthorized("bad credentials")
        assertEquals("bad credentials", err.message)
    }

    @Test
    fun `UserError variants are distinguishable`() {
        val errors: List<UserError> =
            listOf(
                UserError.NotFound("id", 1L),
                UserError.AlreadyExists("email", "x@y.z"),
                UserError.Validation("v"),
                UserError.Unauthorized("u"),
            )
        // when expressions exhaustively branch on the sealed class
        errors.forEach { err ->
            val label =
                when (err) {
                    is UserError.NotFound -> "nf"
                    is UserError.AlreadyExists -> "ae"
                    is UserError.Validation -> "v"
                    is UserError.Unauthorized -> "un"
                }
            assertNotNull(label)
        }
        // equality
        assertEquals(UserError.Validation("x"), UserError.Validation("x"))
        assertNotEquals<UserError>(UserError.Validation("x"), UserError.Validation("y"))
        assertIs<UserError.NotFound>(errors[0])
    }
}
