package pt.isel.user

import kotlin.time.Duration

/**
 * Configuration for user domain logic.
 *
 * @property tokenSizeInBytes The size of the token in bytes.
 * @property tokenTtl The time-to-live for a token.
 * @property tokenRollingTtl The rolling time-to-live for a token.
 * @property maxTokensPerUser The maximum number of active tokens allowed per user.
 */
data class UserDomainConfig(
    val tokenSizeInBytes: Int,
    val tokenTtl: Duration,
    val tokenRollingTtl: Duration,
    val maxTokensPerUser: Int,
) {
    init {
        require(tokenSizeInBytes > 0)
        require(tokenTtl.isPositive())
        require(tokenRollingTtl.isPositive())
        require(maxTokensPerUser > 0)
    }
}