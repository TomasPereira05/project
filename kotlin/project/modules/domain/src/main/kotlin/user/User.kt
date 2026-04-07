package pt.isel.user

data class User(
    val userId: Long,
    val email: String,
    val username: String,
    val passwordValidation: PasswordValidationInfo,
    val role: Role,
    // pode associar a sua conta a um sócio e trocar quando quiser
    val activeMemberId: Long? = null,
)
