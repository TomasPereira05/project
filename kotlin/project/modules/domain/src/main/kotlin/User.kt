package pt.isel

data class User(
    val userId: Long,
    val email: String,
    val username: String,
    val passwordHash: String,
    val role: Role,
)
