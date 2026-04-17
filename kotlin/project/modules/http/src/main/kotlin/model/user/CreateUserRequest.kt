package pt.isel.jagoz.http.model.user

import pt.isel.jagoz.domain.user.Role

data class CreateUserRequest(
    val email: String,
    val username: String,
    val password: String,
    val role: Role,
    val activeMemberId: Long? = null,
)
