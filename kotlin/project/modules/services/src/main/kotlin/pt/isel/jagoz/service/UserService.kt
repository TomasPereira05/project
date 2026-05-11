package pt.isel.jagoz.service

import jakarta.inject.Named
import kotlinx.datetime.Clock
import kotlinx.datetime.Instant
import org.slf4j.LoggerFactory
import pt.isel.jagoz.domain.user.AuthenticatedUser
import pt.isel.jagoz.domain.user.PasswordValidationInfo
import pt.isel.jagoz.domain.user.Role
import pt.isel.jagoz.domain.user.Token
import pt.isel.jagoz.domain.user.User
import pt.isel.jagoz.domain.user.UserDomain
import pt.isel.jagoz.domain.user.toAuthenticatedUser
import pt.isel.jagoz.domain.utils.Either
import pt.isel.jagoz.domain.utils.failure
import pt.isel.jagoz.domain.utils.success
import pt.isel.jagoz.repository.TransactionManager

typealias UserResult = Either<UserServiceError, User>
typealias AuthenticatedUserResult = Either<UserServiceError, AuthenticatedUser>
typealias TokenCreationResult = Either<UserServiceError, TokenExternalInfo>

sealed class UserServiceError {
    data class NotFound(
        val field: String,
        val value: Any,
    ) : UserServiceError()

    data class AlreadyExists(
        val field: String,
        val value: Any,
    ) : UserServiceError()

    data class Validation(
        val message: String,
    ) : UserServiceError()

    data class Unauthorized(
        val message: String,
    ) : UserServiceError()
}

data class TokenExternalInfo(
    val tokenValue: String,
    val tokenExpiration: Instant,
)

@Named
class UserService(
    private val transactionManager: TransactionManager,
    private val userDomain: UserDomain,
    private val clock: Clock,
) {
    companion object {
        private val LOG = LoggerFactory.getLogger(UserService::class.java)
    }

    fun createUser(
        email: String,
        username: String,
        password: String,
        role: Role,
        activeMemberId: Long? = null,
    ): UserResult {
        LOG.info("Creating user with username: {}", username)

        if (email.isBlank()) return failure(UserServiceError.Validation("Email cannot be blank"))
        if (username.isBlank()) return failure(UserServiceError.Validation("Username cannot be blank"))
        if (!userDomain.isSafePassword(password)) {
            return failure(UserServiceError.Validation("Password must have at least 8 characters, one letter, and one digit"))
        }

        return transactionManager.run { transaction ->
            if (transaction.userRepository.findByEmail(email) != null) {
                return@run failure(UserServiceError.AlreadyExists("email", email))
            }

            if (transaction.userRepository.findByUsername(username) != null) {
                return@run failure(UserServiceError.AlreadyExists("username", username))
            }

            if (activeMemberId != null && transaction.memberRepository.findById(activeMemberId) == null) {
                return@run failure(UserServiceError.NotFound("activeMemberId", activeMemberId))
            }

            val userToSave =
                User(
                    userId = 0,
                    email = email,
                    username = username,
                    passwordValidation = PasswordValidationInfo(userDomain.encodePassword(password)),
                    role = role,
                    activeMemberId = activeMemberId,
                )

            val userId = transaction.userRepository.save(userToSave)
            success(userToSave.copy(userId = userId))
        }
    }

    fun getUserById(userId: Long): UserResult =
        transactionManager.run { transaction ->
            val user =
                transaction.userRepository.findById(userId)
                    ?: return@run failure(UserServiceError.NotFound("userId", userId))

            success(user)
        }

    fun getUserByEmail(email: String): UserResult =
        transactionManager.run { transaction ->
            val user =
                transaction.userRepository.findByEmail(email)
                    ?: return@run failure(UserServiceError.NotFound("email", email))

            success(user)
        }

    fun getUserByUsername(username: String): UserResult =
        transactionManager.run { transaction ->
            val user =
                transaction.userRepository.findByUsername(username)
                    ?: return@run failure(UserServiceError.NotFound("username", username))

            success(user)
        }

    fun getUsersPage(
        authenticatedUser: AuthenticatedUser,
        page: Int,
        size: Int,
    ): Either<UserServiceError, Page<User>> {
        if (authenticatedUser.role != Role.ADMIN && authenticatedUser.role != Role.SECRETARIA) {
            return failure(UserServiceError.Unauthorized("Not authorized"))
        }

        val request = pageRequest(page, size)
        return transactionManager.run { transaction ->
            success(
                pageOf(
                    items = transaction.userRepository.findPage(request.size, request.offset),
                    request = request,
                    total = transaction.userRepository.countAll(),
                ),
            )
        }
    }

    fun getUserByToken(token: String): User? {
        if (!userDomain.isTokenValidFormat(token)) {
            return null
        }

        return transactionManager.run { transaction ->
            val userRepository = transaction.userRepository

            val tokenValidationInfo = userDomain.createTokenValidationInformation(token)

            val userAndToken = userRepository.getTokenByValidation(tokenValidationInfo)

            if (userAndToken != null) {
                val isValid = userDomain.isTokenTimeValid(clock, userAndToken.second)

                if (isValid) {
                    userRepository.updateTokenLastUsed(userAndToken.second, clock.now())
                    return@run userAndToken.first
                }
            }

            null
        }
    }

    fun revokeToken(token: String): Boolean {
        val tokenValidationInfo = userDomain.createTokenValidationInformation(token)
        return transactionManager.run {
            it.userRepository.removeTokenByValidation(tokenValidationInfo)
            true
        }
    }

    fun createToken(
        username: String,
        password: String,
    ): TokenCreationResult {
        if (username.isBlank() || password.isBlank()) {
            return failure(UserServiceError.Validation("Username or Password cannot be blank"))
        }

        return transactionManager.run { transaction ->
            val user: User =
                transaction.userRepository.findByUsername(username)
                    ?: return@run failure(UserServiceError.NotFound("username", username))

            if (!userDomain.validatePassword(password, user.passwordValidation)) {
                return@run failure(UserServiceError.Validation("Invalid Password"))
            }

            val tokenValue = userDomain.generateTokenValue()
            val now = clock.now()

            val newToken =
                Token(
                    userDomain.createTokenValidationInformation(tokenValue),
                    user.userId,
                    createdAt = now,
                    lastUsedAt = now,
                )
            // max token location ainda nao decidido
            transaction.userRepository.createToken(newToken)

            success(TokenExternalInfo(tokenValue, userDomain.getTokenExpiration(newToken)))
        }
    }

    fun login(
        identifier: String,
        password: String,
    ): AuthenticatedUserResult {
        if (identifier.isBlank()) return failure(UserServiceError.Validation("Identifier cannot be blank"))
        if (password.isBlank()) return failure(UserServiceError.Validation("Password cannot be blank"))

        return transactionManager.run { transaction ->
            val user = transaction.userRepository.findByUsername(identifier) ?: transaction.userRepository.findByEmail(identifier)
            if (user == null || !userDomain.validatePassword(password, user.passwordValidation)) {
                return@run failure(UserServiceError.Unauthorized("Invalid credentials"))
            }

            val (token, rawToken) = userDomain.createToken(user.userId)
            transaction.userRepository.createToken(token)
            success(user.toAuthenticatedUser(rawToken))
        }
    }

    fun logout(token: String): Either<UserServiceError, Unit> {
        if (!userDomain.isTokenValidFormat(token)) {
            return failure(UserServiceError.Unauthorized("Invalid token"))
        }

        return transactionManager.run { transaction ->
            val validation = userDomain.createTokenValidationInformation(token)
            val removed = transaction.userRepository.removeTokenByValidation(validation)
            if (removed == 0) return@run failure(UserServiceError.Unauthorized("Invalid token"))

            success(Unit)
        }
    }
}
