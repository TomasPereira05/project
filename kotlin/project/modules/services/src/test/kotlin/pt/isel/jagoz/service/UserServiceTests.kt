package pt.isel.jagoz.service

import kotlinx.datetime.Clock
import kotlinx.datetime.Instant
import org.springframework.security.crypto.password.PasswordEncoder
import pt.isel.jagoz.domain.user.AuthenticatedUser
import pt.isel.jagoz.domain.user.PasswordValidationInfo
import pt.isel.jagoz.domain.user.Role
import pt.isel.jagoz.domain.user.Sha256TokenEncoder
import pt.isel.jagoz.domain.user.UserDomain
import pt.isel.jagoz.domain.user.UserDomainConfig
import pt.isel.jagoz.domain.user.UserError
import pt.isel.jagoz.domain.utils.Either
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertIs
import kotlin.test.assertNotEquals
import kotlin.test.assertNull
import kotlin.test.assertTrue
import kotlin.time.Duration.Companion.hours
import kotlin.time.Duration.Companion.minutes

class UserServiceTests {
    private class FakePasswordEncoder : PasswordEncoder {
        override fun encode(rawPassword: CharSequence?): String = "ENC:$rawPassword"

        override fun matches(
            rawPassword: CharSequence?,
            encodedPassword: String?,
        ): Boolean = encodedPassword == encode(rawPassword)
    }

    private class MutableClock(
        var current: Instant,
    ) : Clock {
        override fun now(): Instant = current
    }

    private val txManager = FakeTransactionManager()
    private val tx = txManager.tx

    // UserDomain.createToken usa Clock.System, por isso o clock de teste parte de "agora"
    // (com folga, para tokens criados milissegundos depois não parecerem do futuro)
    private val clock = MutableClock(Clock.System.now() + 1.minutes)
    private val userDomain =
        UserDomain(
            FakePasswordEncoder(),
            Sha256TokenEncoder(),
            UserDomainConfig(
                tokenSizeInBytes = 32,
                tokenTtl = 24.hours,
                tokenRollingTtl = 12.hours,
                maxTokensPerUser = 5,
            ),
        )
    private val service = UserService(txManager, userDomain, clock)

    private val admin = testAuth(Role.ADMIN, userId = 1)
    private val normal = testAuth(Role.NORMAL, userId = 5)

    // ---- createUser ----

    @Test
    fun `createUser stores the encoded password never the raw one`() {
        val result = service.createUser("novo@example.test", "novo", "Passw0rd1", Role.NORMAL)

        assertIs<Either.Right<*>>(result)
        val saved =
            tx.userRepository.users.values
                .single()
        assertEquals("ENC:Passw0rd1", saved.passwordValidation.validationInfo)
        assertNotEquals("Passw0rd1", saved.passwordValidation.validationInfo)
    }

    @Test
    fun `createUser validates email username and password strength`() {
        assertIs<UserError.Validation>(
            assertIs<Either.Left<*>>(service.createUser(" ", "novo", "Passw0rd1", Role.NORMAL)).value,
        )
        assertIs<UserError.Validation>(
            assertIs<Either.Left<*>>(service.createUser("novo@example.test", " ", "Passw0rd1", Role.NORMAL)).value,
        )
        assertIs<UserError.Validation>(
            assertIs<Either.Left<*>>(service.createUser("novo@example.test", "novo", "fraca", Role.NORMAL)).value,
        )
        assertTrue(tx.userRepository.users.isEmpty())
    }

    @Test
    fun `createUser rejects duplicate email and username`() {
        tx.userRepository.seed(testUser(userId = 1))

        val sameEmail = service.createUser("u1@example.test", "outro", "Passw0rd1", Role.NORMAL)
        assertEquals("email", assertIs<UserError.AlreadyExists>(assertIs<Either.Left<*>>(sameEmail).value).field)

        val sameUsername = service.createUser("outro@example.test", "u1", "Passw0rd1", Role.NORMAL)
        assertEquals("username", assertIs<UserError.AlreadyExists>(assertIs<Either.Left<*>>(sameUsername).value).field)
    }

    @Test
    fun `createUser rejects an activeMemberId that does not exist`() {
        val result = service.createUser("novo@example.test", "novo", "Passw0rd1", Role.NORMAL, activeMemberId = 99)

        assertIs<UserError.NotFound>(assertIs<Either.Left<*>>(result).value)
    }

    // ---- login / tokens ----

    private fun seedAccount(
        userId: Long = 5,
        password: String = "Passw0rd1",
    ) = tx.userRepository.seed(
        testUser(userId = userId).copy(passwordValidation = PasswordValidationInfo("ENC:$password")),
    )

    @Test
    fun `login works with username or email and returns a usable token`() {
        seedAccount()

        val byUsername = service.login("u5", "Passw0rd1")
        assertIs<Either.Right<AuthenticatedUser>>(byUsername)
        val auth = byUsername.value
        assertEquals(5, auth.userId)
        assertEquals(auth.userId, service.getUserByToken(auth.token)?.userId)

        assertIs<Either.Right<*>>(service.login("u5@example.test", "Passw0rd1"))
    }

    @Test
    fun `login rejects wrong password and unknown identifier with the same error`() {
        seedAccount()

        val wrongPassword = assertIs<Either.Left<*>>(service.login("u5", "errada"))
        val unknownUser = assertIs<Either.Left<*>>(service.login("ghost", "Passw0rd1"))
        assertIs<UserError.Unauthorized>(wrongPassword.value)
        assertIs<UserError.Unauthorized>(unknownUser.value)
    }

    @Test
    fun `createToken authenticates and reports the expiration`() {
        seedAccount()

        val result = service.createToken("u5", "Passw0rd1")

        val info = assertIs<Either.Right<TokenExternalInfo>>(result).value
        assertTrue(info.tokenValue.isNotBlank())
        assertEquals(clock.current + 12.hours, info.tokenExpiration)
    }

    @Test
    fun `createToken rejects bad credentials`() {
        seedAccount()

        assertIs<UserError.Validation>(assertIs<Either.Left<*>>(service.createToken(" ", "x")).value)
        assertIs<UserError.NotFound>(assertIs<Either.Left<*>>(service.createToken("ghost", "Passw0rd1")).value)
        assertIs<UserError.Validation>(assertIs<Either.Left<*>>(service.createToken("u5", "errada")).value)
    }

    @Test
    fun `getUserByToken rejects malformed and expired tokens`() {
        seedAccount()
        val token = assertIs<Either.Right<TokenExternalInfo>>(service.createToken("u5", "Passw0rd1")).value.tokenValue

        assertNull(service.getUserByToken("malformed"))
        assertEquals(5, service.getUserByToken(token)?.userId)

        clock.current += 13.hours
        assertNull(service.getUserByToken(token))
    }

    @Test
    fun `using a token slides its rolling expiration`() {
        seedAccount()
        val token = assertIs<Either.Right<TokenExternalInfo>>(service.createToken("u5", "Passw0rd1")).value.tokenValue

        clock.current += 11.hours
        assertEquals(5, service.getUserByToken(token)?.userId)

        clock.current += 11.hours
        assertEquals(5, service.getUserByToken(token)?.userId)

        clock.current += 3.hours
        assertNull(service.getUserByToken(token), "absolute TTL must still cap the rolling window")
    }

    @Test
    fun `logout removes the token and repeated logout fails`() {
        seedAccount()
        val token = assertIs<Either.Right<TokenExternalInfo>>(service.createToken("u5", "Passw0rd1")).value.tokenValue

        assertIs<Either.Right<*>>(service.logout(token))
        assertNull(service.getUserByToken(token))
        assertIs<UserError.Unauthorized>(assertIs<Either.Left<*>>(service.logout(token)).value)
        assertIs<UserError.Unauthorized>(assertIs<Either.Left<*>>(service.logout("malformed")).value)
    }

    // ---- gestão (staff-only) ----

    @Test
    fun `management endpoints require backoffice roles`() {
        tx.userRepository.seed(testUser(userId = 9))

        assertIs<UserError.Unauthorized>(assertIs<Either.Left<*>>(service.getUserById(normal, 9)).value)
        assertIs<UserError.Unauthorized>(assertIs<Either.Left<*>>(service.updateUserRole(normal, 9, Role.ADMIN)).value)
        assertIs<UserError.Unauthorized>(assertIs<Either.Left<*>>(service.updateActiveMember(normal, 9, null)).value)
        assertIs<UserError.Unauthorized>(assertIs<Either.Left<*>>(service.getUsersPage(normal, 1, 10, null, null)).value)
    }

    @Test
    fun `updateUserRole persists the new role`() {
        tx.userRepository.seed(testUser(userId = 9))

        val result = service.updateUserRole(admin, 9, Role.SECRETARIA)

        assertIs<Either.Right<*>>(result)
        assertEquals(
            Role.SECRETARIA,
            tx.userRepository.users
                .getValue(9)
                .role,
        )
    }

    @Test
    fun `updateActiveMember refuses a member already claimed by another user`() {
        tx.userRepository.seed(testUser(userId = 9))
        tx.memberRepository.seed(testMember(memberId = 20, userId = 8))

        val result = service.updateActiveMember(admin, 9, 20)

        assertIs<UserError.Validation>(assertIs<Either.Left<*>>(result).value)
    }

    @Test
    fun `updateActiveMember claims the new member and releases the previous one`() {
        tx.userRepository.seed(testUser(userId = 9, activeMemberId = 20))
        tx.memberRepository.seed(testMember(memberId = 20, userId = 9))
        tx.memberRepository.seed(testMember(memberId = 21, userId = null))

        val result = service.updateActiveMember(admin, 9, 21)

        assertIs<Either.Right<*>>(result)
        assertEquals(
            21,
            tx.userRepository.users
                .getValue(9)
                .activeMemberId,
        )
        assertEquals(
            9,
            tx.memberRepository.members
                .getValue(21)
                .userId,
        )
        assertNull(
            tx.memberRepository.members
                .getValue(20)
                .userId,
        )
    }
}
