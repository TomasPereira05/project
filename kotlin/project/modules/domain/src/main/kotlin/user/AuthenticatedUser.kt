package pt.isel.user

/**
 * Represents an authenticated user with their associated token.
 *
 * @property user The user details.
 * @property token The authentication token string.
 */
data class AuthenticatedUser(
    val user: User,
    val token: String,
) {
    init {
        require(token.isNotBlank()) { "Token cannot be empty" }
    }
}
