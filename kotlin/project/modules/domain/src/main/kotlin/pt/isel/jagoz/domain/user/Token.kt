package pt.isel.jagoz.domain.user

import kotlinx.datetime.Instant

/**
 * Represents an authentication token.
 *
 * @property tokenValidationInfo The validation info (hash) of the token.
 * @property userId The ID of the user the token belongs to.
 * @property createdAt The timestamp when the token was created.
 * @property lastUsedAt The timestamp when the token was last used.
 */
data class Token(
    val tokenValidationInfo: TokenValidationInfo,
    val userId: Long,
    val createdAt: Instant,
    val lastUsedAt: Instant,
)
