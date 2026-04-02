package pt.isel

data class User(
    val userId: Long,
    val email: String,
    val username: String,
    val passwordHash: String,
    val role: Role,
    val activeMemberId: Long? = null // pode associar a sua conta a um sócio e trocar quando quiser
)
