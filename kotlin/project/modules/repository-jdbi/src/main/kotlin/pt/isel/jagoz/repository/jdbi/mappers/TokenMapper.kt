package pt.isel.jagoz.repository.jdbi.mappers

import kotlinx.datetime.Instant
import org.jdbi.v3.core.mapper.RowMapper
import org.jdbi.v3.core.statement.StatementContext
import pt.isel.jagoz.domain.user.Token
import pt.isel.jagoz.domain.user.TokenValidationInfo
import java.sql.ResultSet

class TokenMapper : RowMapper<Token> {
    override fun map(
        rs: ResultSet,
        ctx: StatementContext,
    ): Token =
        Token(
            tokenValidationInfo = TokenValidationInfo(rs.getString("token_validation")),
            userId = rs.getLong("user_id"),
            createdAt = rs.getTimestamp("created_at").toInstant().let { Instant.fromEpochMilliseconds(it.toEpochMilli()) },
            lastUsedAt = rs.getTimestamp("last_used_at").toInstant().let { Instant.fromEpochMilliseconds(it.toEpochMilli()) },
        )
}
