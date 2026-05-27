package pt.isel.jagoz.service

import jakarta.inject.Named
import kotlinx.datetime.Clock
import kotlinx.datetime.Instant
import org.slf4j.LoggerFactory
import pt.isel.jagoz.domain.athlete.Athlete
import pt.isel.jagoz.domain.member.Member
import pt.isel.jagoz.domain.sponsor.Sponsor
import pt.isel.jagoz.domain.user.AuthenticatedUser
import pt.isel.jagoz.domain.user.PasswordValidationInfo
import pt.isel.jagoz.domain.user.Role
import pt.isel.jagoz.domain.user.Token
import pt.isel.jagoz.domain.user.User
import pt.isel.jagoz.domain.user.UserDomain
import pt.isel.jagoz.domain.user.UserError
import pt.isel.jagoz.domain.user.canManageBackoffice
import pt.isel.jagoz.domain.user.toAuthenticatedUser
import pt.isel.jagoz.domain.utils.Either
import pt.isel.jagoz.domain.utils.failure
import pt.isel.jagoz.domain.utils.success
import pt.isel.jagoz.repository.TransactionManager

typealias UserResult = Either<UserError, User>
typealias AuthenticatedUserResult = Either<UserError, AuthenticatedUser>
typealias TokenCreationResult = Either<UserError, TokenExternalInfo>
typealias UserAssociationsResult = Either<UserError, UserAssociations>

data class TokenExternalInfo(
    val tokenValue: String,
    val tokenExpiration: Instant,
)

data class UserAssociations(
    val member: Member?,
    val athlete: Athlete?,
    val sponsors: List<Sponsor>,
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

        if (email.isBlank()) return failure(UserError.Validation("Email cannot be blank"))
        if (username.isBlank()) return failure(UserError.Validation("Username cannot be blank"))
        if (!userDomain.isSafePassword(password)) {
            return failure(UserError.Validation("Password must have at least 8 characters, one letter, and one digit"))
        }

        return transactionManager.run { transaction ->
            if (transaction.userRepository.findByEmail(email) != null) {
                return@run failure(UserError.AlreadyExists("email", email))
            }

            if (transaction.userRepository.findByUsername(username) != null) {
                return@run failure(UserError.AlreadyExists("username", username))
            }

            if (activeMemberId != null && transaction.memberRepository.findById(activeMemberId) == null) {
                return@run failure(UserError.NotFound("activeMemberId", activeMemberId))
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
                    ?: return@run failure(UserError.NotFound("userId", userId))

            success(user)
        }

    fun getUserById(
        authenticatedUser: AuthenticatedUser,
        userId: Long,
    ): UserResult {
        if (!authenticatedUser.canManageBackoffice()) return failure(UserError.Unauthorized("Not authorized"))
        return getUserById(userId)
    }

    fun updateUserRole(
        authenticatedUser: AuthenticatedUser,
        userId: Long,
        role: Role,
    ): UserResult {
        if (!authenticatedUser.canManageBackoffice()) return failure(UserError.Unauthorized("Not authorized"))

        return transactionManager.run { transaction ->
            val user =
                transaction.userRepository.findById(userId)
                    ?: return@run failure(UserError.NotFound("userId", userId))

            val updated = user.copy(role = role)
            transaction.userRepository.update(updated)
            success(updated)
        }
    }

    fun updateActiveMember(
        authenticatedUser: AuthenticatedUser,
        userId: Long,
        memberId: Long?,
    ): UserResult {
        if (!authenticatedUser.canManageBackoffice()) return failure(UserError.Unauthorized("Not authorized"))

        return transactionManager.run { transaction ->
            val user =
                transaction.userRepository.findById(userId)
                    ?: return@run failure(UserError.NotFound("userId", userId))

            val newMember =
                memberId?.let {
                    transaction.memberRepository.findById(it)
                        ?: return@run failure(UserError.NotFound("memberId", it))
                }

            if (newMember?.userId != null && newMember.userId != userId) {
                return@run failure(UserError.Validation("Member is already associated with another user"))
            }

            user.activeMemberId
                ?.takeIf { it != memberId }
                ?.let { transaction.memberRepository.findById(it) }
                ?.takeIf { it.userId == userId }
                ?.let { transaction.memberRepository.update(it.copy(userId = null)) }

            if (newMember != null && newMember.userId != userId) {
                transaction.memberRepository.update(newMember.copy(userId = userId))
            }

            val updated = user.copy(activeMemberId = memberId)
            transaction.userRepository.update(updated)
            success(updated)
        }
    }

    fun getUserAssociations(
        authenticatedUser: AuthenticatedUser,
        userId: Long,
    ): UserAssociationsResult {
        if (!authenticatedUser.canManageBackoffice()) return failure(UserError.Unauthorized("Not authorized"))

        return transactionManager.run { transaction ->
            val user =
                transaction.userRepository.findById(userId)
                    ?: return@run failure(UserError.NotFound("userId", userId))

            val member = user.activeMemberId?.let { transaction.memberRepository.findById(it) }
            val athlete = member?.let { transaction.athleteRepository.findByMemberId(it.memberId) }
            val sponsors = transaction.sponsorRepository.findByUserId(userId)

            success(UserAssociations(member = member, athlete = athlete, sponsors = sponsors))
        }
    }

    fun getUserByEmail(email: String): UserResult =
        transactionManager.run { transaction ->
            val user =
                transaction.userRepository.findByEmail(email)
                    ?: return@run failure(UserError.NotFound("email", email))

            success(user)
        }

    fun getUserByEmail(
        authenticatedUser: AuthenticatedUser,
        email: String,
    ): UserResult {
        if (!authenticatedUser.canManageBackoffice()) return failure(UserError.Unauthorized("Not authorized"))
        return getUserByEmail(email)
    }

    fun getUserByUsername(username: String): UserResult =
        transactionManager.run { transaction ->
            val user =
                transaction.userRepository.findByUsername(username)
                    ?: return@run failure(UserError.NotFound("username", username))

            success(user)
        }

    fun getUserByUsername(
        authenticatedUser: AuthenticatedUser,
        username: String,
    ): UserResult {
        if (!authenticatedUser.canManageBackoffice()) return failure(UserError.Unauthorized("Not authorized"))
        return getUserByUsername(username)
    }

    fun getUsersPage(
        authenticatedUser: AuthenticatedUser,
        page: Int,
        size: Int,
        search: String?,
        role: Role?,
    ): Either<UserError, Page<User>> {
        if (!authenticatedUser.canManageBackoffice()) {
            return failure(UserError.Unauthorized("Not authorized"))
        }

        val request = pageRequest(page, size)
        return transactionManager.run { transaction ->
            success(
                pageOf(
                    items = transaction.userRepository.findPageFiltered(request.size, request.offset, search, role),
                    request = request,
                    total = transaction.userRepository.countFiltered(search, role),
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
            return failure(UserError.Validation("Username or Password cannot be blank"))
        }

        return transactionManager.run { transaction ->
            val user: User =
                transaction.userRepository.findByUsername(username)
                    ?: return@run failure(UserError.NotFound("username", username))

            if (!userDomain.validatePassword(password, user.passwordValidation)) {
                return@run failure(UserError.Validation("Invalid Password"))
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
        if (identifier.isBlank()) return failure(UserError.Validation("Identifier cannot be blank"))
        if (password.isBlank()) return failure(UserError.Validation("Password cannot be blank"))

        return transactionManager.run { transaction ->
            val user = transaction.userRepository.findByUsername(identifier) ?: transaction.userRepository.findByEmail(identifier)
            if (user == null || !userDomain.validatePassword(password, user.passwordValidation)) {
                return@run failure(UserError.Unauthorized("Invalid credentials"))
            }

            val (token, rawToken) = userDomain.createToken(user.userId)
            transaction.userRepository.createToken(token)
            success(user.toAuthenticatedUser(rawToken))
        }
    }

    fun logout(token: String): Either<UserError, Unit> {
        if (!userDomain.isTokenValidFormat(token)) {
            return failure(UserError.Unauthorized("Invalid token"))
        }

        return transactionManager.run { transaction ->
            val validation = userDomain.createTokenValidationInformation(token)
            val removed = transaction.userRepository.removeTokenByValidation(validation)
            if (removed == 0) return@run failure(UserError.Unauthorized("Invalid token"))

            success(Unit)
        }
    }
}
