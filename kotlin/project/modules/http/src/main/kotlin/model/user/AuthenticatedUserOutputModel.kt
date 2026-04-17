package pt.isel.jagoz.http.model.user

data class AuthenticatedUserOutputModel(
    val userId: Long,
    val username: String,
    val activeMemberId: Long?,
    val token: String,
)
