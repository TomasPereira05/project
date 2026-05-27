package pt.isel.jagoz.repository

import kotlinx.datetime.Instant
import pt.isel.jagoz.domain.user.PasswordValidationInfo
import pt.isel.jagoz.domain.user.Role
import pt.isel.jagoz.domain.user.Token
import pt.isel.jagoz.domain.user.TokenValidationInfo
import pt.isel.jagoz.domain.user.User

interface UserRepository {
    fun save(user: User): Long

    fun updatePassword(
        userId: Long,
        newPassword: PasswordValidationInfo,
    )

    fun findById(id: Long): User?

    fun findByUsername(username: String): User?

    fun findByEmail(email: String): User?

    fun findPage(
        limit: Int,
        offset: Int,
    ): List<User>

    fun countAll(): Long

    fun findPageFiltered(
        limit: Int,
        offset: Int,
        search: String?,
        role: Role?,
    ): List<User>

    fun countFiltered(
        search: String?,
        role: Role?,
    ): Long

    fun update(user: User)

    // GestÃ£o dos maxTokens talvez possa ser feita no domain ou no service, nÃ£o aqui
    fun createToken(token: Token)

    fun getTokenByValidation(validation: TokenValidationInfo): Pair<User, Token>?

    fun updateTokenLastUsed(
        token: Token,
        now: Instant,
    )

    fun removeTokenByValidation(validation: TokenValidationInfo): Int
}
