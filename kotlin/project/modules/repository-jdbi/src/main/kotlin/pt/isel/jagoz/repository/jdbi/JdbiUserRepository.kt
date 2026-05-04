package pt.isel.jagoz.repository.jdbi

import kotlinx.datetime.Instant
import org.jdbi.v3.core.Handle
import pt.isel.jagoz.domain.user.PasswordValidationInfo
import pt.isel.jagoz.domain.user.Token
import pt.isel.jagoz.domain.user.TokenValidationInfo
import pt.isel.jagoz.domain.user.User
import pt.isel.jagoz.repository.UserRepository
import pt.isel.jagoz.repository.jdbi.mappers.TokenMapper
import pt.isel.jagoz.repository.jdbi.mappers.UserMapper

class JdbiUserRepository(private val handle: Handle) : UserRepository {
    override fun save(user: User): Long {
        return handle.createUpdate(
            """
            INSERT INTO jagoz.users (email, username, password_validation, role, active_member_id)
            VALUES (:email, :username, :passwordValidation, CAST(:role AS jagoz.user_role), :activeMemberId)
            """,
        )
            .bind("email", user.email)
            .bind("username", user.username)
            .bind("passwordValidation", user.passwordValidation.validationInfo)
            .bind("role", user.role.name)
            .bind("activeMemberId", user.activeMemberId)
            .executeAndReturnGeneratedKeys()
            .mapTo(Long::class.java)
            .one()
    }

    override fun updatePassword(
        userId: Long,
        newPassword: PasswordValidationInfo,
    ) {
        handle.createUpdate("UPDATE jagoz.users SET password_validation = :pw WHERE user_id = :id")
            .bind("pw", newPassword.validationInfo)
            .bind("id", userId)
            .execute()
    }

    override fun findById(id: Long): User? {
        return handle.createQuery("SELECT * FROM jagoz.users WHERE user_id = :id")
            .bind("id", id)
            .map(UserMapper())
            .findOne()
            .orElse(null)
    }

    override fun findByUsername(username: String): User? {
        return handle.createQuery("SELECT * FROM jagoz.users WHERE username = :username")
            .bind("username", username)
            .map(UserMapper())
            .findOne()
            .orElse(null)
    }

    override fun findByEmail(email: String): User? {
        return handle.createQuery("SELECT * FROM jagoz.users WHERE email = :email")
            .bind("email", email)
            .map(UserMapper())
            .findOne()
            .orElse(null)
    }

    override fun update(user: User) {
        handle.createUpdate(
            """
            UPDATE jagoz.users SET 
                email = :email, 
                username = :username, 
                password_validation = :passwordValidation, 
                role = CAST(:role AS user_role), 
                active_member_id = :activeMemberId
            WHERE user_id = :id
            """,
        )
            .bind("id", user.userId)
            .bind("email", user.email)
            .bind("username", user.username)
            .bind("passwordValidation", user.passwordValidation.validationInfo)
            .bind("role", user.role.name)
            .bind("activeMemberId", user.activeMemberId)
            .execute()
    }

    override fun createToken(token: Token) {
        handle.createUpdate(
            """
            INSERT INTO jagoz.user_token (token_validation, user_id, created_at, last_used_at)
            VALUES (:validation, :userId, :createdAt, :lastUsedAt)
            """,
        )
            .bind("validation", token.tokenValidationInfo.validationInfo)
            .bind("userId", token.userId)
            .bind("createdAt", token.createdAt)
            .bind("lastUsedAt", token.lastUsedAt)
            .execute()
    }

    override fun getTokenByValidation(validation: TokenValidationInfo): Pair<User, Token>? {
        val userWithToken =
            handle.createQuery(
                """
            SELECT u.*, t.token_validation, t.created_at, t.last_used_at 
            FROM jagoz.users u
            JOIN jagoz.user_token t ON u.user_id = t.user_id
            WHERE t.token_validation = :validation
            """,
            )
                .bind("validation", validation.validationInfo)
                .map { rs, ctx ->
                    val user = UserMapper().map(rs, ctx)
                    val token = TokenMapper().map(rs, ctx)
                    Pair(user, token)
                }
                .findOne()

        return userWithToken.orElse(null)
    }

    override fun updateTokenLastUsed(
        token: Token,
        now: Instant,
    ) {
        handle.createUpdate("UPDATE jagoz.user_token SET last_used_at = :now WHERE token_validation = :validation")
            .bind("now", now)
            .bind("validation", token.tokenValidationInfo.validationInfo)
            .execute()
    }

    override fun removeTokenByValidation(validation: TokenValidationInfo): Int {
        return handle.createUpdate("DELETE FROM jagoz.user_token WHERE token_validation = :validation")
            .bind("validation", validation.validationInfo)
            .execute()
    }
}
