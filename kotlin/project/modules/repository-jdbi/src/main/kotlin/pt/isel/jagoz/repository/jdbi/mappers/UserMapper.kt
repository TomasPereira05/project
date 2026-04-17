package pt.isel.jagoz.repository.jdbi.mappers

import org.jdbi.v3.core.mapper.RowMapper
import org.jdbi.v3.core.statement.StatementContext
import pt.isel.jagoz.user.PasswordValidationInfo
import pt.isel.jagoz.user.Role
import pt.isel.jagoz.user.User
import java.sql.ResultSet

class UserMapper : RowMapper<User> {
    override fun map(
        rs: ResultSet,
        ctx: StatementContext,
    ): User {
        val activeMemberId = (rs.getObject("active_member_id") as? Number)?.toLong()

        return User(
            userId = rs.getLong("user_id"),
            email = rs.getString("email"),
            username = rs.getString("username"),
            passwordValidation = PasswordValidationInfo(rs.getString("password_validation")),
            role = Role.valueOf(rs.getString("role")),
            activeMemberId = activeMemberId,
        )
    }
}
