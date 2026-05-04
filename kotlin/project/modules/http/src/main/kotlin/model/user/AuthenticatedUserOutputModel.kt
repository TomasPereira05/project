package pt.isel.jagoz.http.model.user

import pt.isel.jagoz.domain.user.Role

data class AuthenticatedUserOutputModel(
    val userId: Long,
    val username: String,
    val activeMemberId: Long?,
    val role: Role,
    val token: String,
)
