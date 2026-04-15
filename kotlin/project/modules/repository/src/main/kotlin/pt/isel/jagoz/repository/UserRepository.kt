package pt.isel.jagoz.repository.pt.isel.jagoz.repository

import kotlinx.datetime.Instant
import pt.isel.jagoz.user.PasswordValidationInfo
import pt.isel.jagoz.user.Token
import pt.isel.jagoz.user.TokenValidationInfo
import pt.isel.jagoz.user.User

interface UserRepository {
    fun save(user: User): Long

    fun updatePassword(
        userId: Long,
        newPassword: PasswordValidationInfo,
    )

    fun findById(id: Long): User?

    fun findByUsername(username: String): User?

    fun findByEmail(email: String): User?

    fun update(user: User)

    // Gestão dos maxTokens talvez possa ser feita no domain ou no service, não aqui
    fun createToken(token: Token)

    fun getTokenByValidation(validation: TokenValidationInfo): Pair<User, Token>?

    fun updateTokenLastUsed(
        token: Token,
        now: Instant,
    )

    fun removeTokenByValidation(validation: TokenValidationInfo): Int
}
