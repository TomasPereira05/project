package pt.isel.user

import pt.isel.user.Role

data class User(
    val userId: Long,
    val email: String,
    val username: String,
    val passwordValidation: PasswordValidationInfo,
    val role: Role,
    val activeMemberId: Long? = null // pode associar a sua conta a um sócio e trocar quando quiser
)