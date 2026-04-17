package pt.isel.jagoz.http.model.user

data class LoginRequest(
    val identifier: String,
    val password: String,
)
