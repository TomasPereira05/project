package pt.isel.jagoz.http.model.user

import pt.isel.jagoz.domain.user.Role
import pt.isel.jagoz.domain.user.User

data class UserOutputModel(
    val userId: Long,
    val email: String,
    val username: String,
    val role: Role,
    val activeMemberId: Long?,
)

fun User.toOutputModel() =
    UserOutputModel(
        userId = userId,
        email = email,
        username = username,
        role = role,
        activeMemberId = activeMemberId,
    )
