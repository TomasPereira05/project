package pt.isel.user

/**
 * Contains information required to validate a token (e.g., hash).
 *
 * @property validationInfo The encoded token validation string.
 */
data class TokenValidationInfo(
    val validationInfo: String,
)