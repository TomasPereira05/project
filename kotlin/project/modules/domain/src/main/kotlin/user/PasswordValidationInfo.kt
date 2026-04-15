package pt.isel.jagoz.user

/**
 * Contains information required to validate a password (e.g., hash).
 *
 * @property validationInfo The encoded password validation string.
 */
data class PasswordValidationInfo(
    val validationInfo: String,
)
