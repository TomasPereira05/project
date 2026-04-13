package pt.isel.jagoz.repository.jdbi.mappers

import kotlinx.datetime.Instant
import pt.isel.jagoz.user.Token
import pt.isel.jagoz.user.TokenValidationInfo
import java.sql.ResultSet

object TokenMapper {
    fun map(rs: ResultSet): Token =
        Token(
            tokenValidationInfo = TokenValidationInfo(rs.getString("token_validation")),
            userId = rs.getLong("user_id"),
            createdAt = Instant.parse(rs.getString("created_at").replace(" ", "T")),
            lastUsedAt = Instant.parse(rs.getString("last_used_at").replace(" ", "T")),
        )
}
