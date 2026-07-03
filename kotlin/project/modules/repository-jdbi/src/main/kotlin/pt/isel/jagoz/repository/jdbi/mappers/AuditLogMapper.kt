package pt.isel.jagoz.repository.jdbi.mappers

import kotlinx.datetime.Instant
import org.jdbi.v3.core.mapper.RowMapper
import org.jdbi.v3.core.statement.StatementContext
import pt.isel.jagoz.domain.audit.AuditLog
import pt.isel.jagoz.domain.user.Role
import java.sql.ResultSet

class AuditLogMapper : RowMapper<AuditLog> {
    override fun map(
        rs: ResultSet,
        ctx: StatementContext,
    ): AuditLog =
        AuditLog(
            auditLogId = rs.getLong("audit_log_id"),
            occurredAt = Instant.fromEpochMilliseconds(rs.getTimestamp("occurred_at").toInstant().toEpochMilli()),
            requestId = rs.getString("request_id"),
            userId = (rs.getObject("user_id") as? Number)?.toLong(),
            username = rs.getString("username"),
            role = rs.getString("role")?.let { Role.valueOf(it) },
            action = rs.getString("action"),
            method = rs.getString("method"),
            path = rs.getString("path"),
            queryString = rs.getString("query_string"),
            statusCode = rs.getInt("status_code"),
            durationMs = rs.getLong("duration_ms"),
            ipAddress = rs.getString("ip_address"),
            userAgent = rs.getString("user_agent"),
            outcome = rs.getString("outcome"),
            targetType = rs.getString("target_type"),
            targetId = rs.getString("target_id"),
            errorMessage = rs.getString("error_message"),
        )
}
