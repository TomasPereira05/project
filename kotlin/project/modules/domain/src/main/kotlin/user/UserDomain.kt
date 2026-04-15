package pt.isel.jagoz.user

import kotlinx.datetime.Clock
import kotlinx.datetime.Instant
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Component
import java.security.SecureRandom
import java.util.Base64
import java.util.Base64.getUrlDecoder

/**
 * Domain service for managing user logic, authentication, and token management.
 */
@Component
class UserDomain(
    private val passwordEncoder: PasswordEncoder,
    private val tokenEncoder: TokenEncoder,
    private val config: UserDomainConfig,
) {
    val maxNumberOfTokensPerUser = config.maxTokensPerUser

    /**
     * Generates a secure random token string.
     *
     * @return A Base64 URL-encoded random string.
     */
    fun generateTokenValue(): String =
        ByteArray(config.tokenSizeInBytes).let { byteArray ->
            SecureRandom.getInstanceStrong().nextBytes(byteArray)
            Base64.getUrlEncoder().encodeToString(byteArray)
        }

    /**
     * Creates a new token for a user.
     *
     * @param userId The ID of the user.
     * @return A pair containing the [Token] object and the raw token string.
     * @throws IllegalArgumentException if the userId is not positive.
     */
    fun createToken(userId: Long): Pair<Token, String> {
        if (userId <= 0) {
            throw IllegalArgumentException("User ID must be positive")
        }
        val tokenValue = generateTokenValue()
        val now = Clock.System.now()
        val token =
            Token(
                tokenValidationInfo = tokenEncoder.createValidationInformation(tokenValue),
                userId = userId,
                createdAt = now,
                lastUsedAt = now,
            )
        return Pair(token, tokenValue)
    }

    /**
     * Validates the format of a token string.
     *
     * @param token The token string to validate.
     * @return True if the token has the correct size and format, false otherwise.
     */
    fun isTokenValidFormat(token: String?): Boolean {
        if (token.isNullOrBlank()) return false
        return try {
            getUrlDecoder().decode(token).size == config.tokenSizeInBytes
        } catch (_: IllegalArgumentException) {
            false
        }
    }

    /**
     * Checks if a token is still valid based on time constraints (TTL).
     *
     * @param clock The clock to use for current time.
     * @param token The token to check.
     * @return True if the token is not expired, false otherwise.
     */
    fun isTokenTimeValid(
        clock: Clock,
        token: Token,
    ): Boolean {
        val now = clock.now()
        return token.createdAt <= now &&
            (now - token.createdAt) <= config.tokenTtl &&
            (now - token.lastUsedAt) <= config.tokenRollingTtl
    }

    /**
     * Calculates the expiration time of a token.
     *
     * @param token The token.
     * @return The [Instant] when the token expires.
     */
    fun getTokenExpiration(token: Token): Instant {
        val absoluteExpiration = token.createdAt + config.tokenTtl
        val rollingExpiration = token.lastUsedAt + config.tokenRollingTtl
        return minOf(absoluteExpiration, rollingExpiration)
    }

    /**
     * Creates an authenticated user object with a new token.
     *
     * @param user The user to authenticate.
     * @return An [AuthenticatedUser] containing the user and the new token.
     */
    fun createAuthenticatedUser(user: User): AuthenticatedUser {
        val (_, tokenValue) = createToken(user.userId)
        return AuthenticatedUser(user, tokenValue)
    }

    /**
     * Creates validation information for a token string.
     *
     * @param token The token string.
     * @return [TokenValidationInfo] for the token.
     */
    fun createTokenValidationInformation(token: String): TokenValidationInfo = tokenEncoder.createValidationInformation(token)

    /**
     * Encodes a raw password.
     *
     * @param rawPassword The raw password string.
     * @return The encoded password string.
     */
    fun encodePassword(rawPassword: String): String = passwordEncoder.encode(rawPassword)

    /**
     * Validates a raw password against stored validation info.
     *
     * @param rawPassword The raw password to check.
     * @param validationInfo The stored password validation info.
     * @return True if the password matches, false otherwise.
     */
    fun validatePassword(
        rawPassword: String,
        validationInfo: PasswordValidationInfo,
    ): Boolean = passwordEncoder.matches(rawPassword, validationInfo.validationInfo)

    /**
     * Creates password validation information from a raw password.
     *
     * @param password The raw password.
     * @return [PasswordValidationInfo] containing the encoded password.
     * @throws IllegalArgumentException if the password is empty.
     */
    fun createPasswordValidationInformation(password: String): PasswordValidationInfo {
        require(password.isNotEmpty()) { "Password cannot be null or empty" }
        return PasswordValidationInfo(
            validationInfo = passwordEncoder.encode(password),
        )
    }

    /**
     * Checks if a password meets security requirements.
     *
     * @param password The password to check.
     * @return True if the password is safe (at least 8 chars, contains digit and letter).
     */
    fun isSafePassword(password: String): Boolean = password.length >= 8 && password.any { it.isDigit() } && password.any { it.isLetter() }
}
