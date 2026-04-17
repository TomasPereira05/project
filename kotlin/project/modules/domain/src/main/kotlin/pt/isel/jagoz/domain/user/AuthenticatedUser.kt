package pt.isel.jagoz.domain.user

/**
 * Represents the authenticated principal that travels through the application.
 * It contains only the identity/authorization data we need during requests,
 * avoiding carrying the full domain [User] including password validation data.
 *
 * @property userId The authenticated user's id.
 * @property email The authenticated user's email.
 * @property username The authenticated user's username.
 * @property role The authenticated user's role.
 * @property activeMemberId The associated member id, when available.
 * @property token The authentication token string.
 */
data class AuthenticatedUser(
    val userId: Long,
    val email: String,
    val username: String,
    val role: Role,
    val activeMemberId: Long?,
    val token: String,
) {
    init {
        require(token.isNotBlank()) { "Token cannot be empty" }
    }
}

fun User.toAuthenticatedUser(token: String) =
    AuthenticatedUser(
        userId = userId,
        email = email,
        username = username,
        role = role,
        activeMemberId = activeMemberId,
        token = token,
    )
