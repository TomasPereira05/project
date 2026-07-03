package pt.isel.jagoz.repository.jdbi

import org.jdbi.v3.core.Handle
import pt.isel.jagoz.domain.audit.AuditLog
import pt.isel.jagoz.repository.AuditLogRepository

class JdbiAuditLogRepository(
    private val handle: Handle,
) : AuditLogRepository {
    override fun save(auditLog: AuditLog): Long =
        handle
            .createUpdate(
                """
                INSERT INTO jagoz.audit_log (
                    occurred_at, request_id, user_id, username, role, action, method,
                    path, query_string, status_code, duration_ms, ip_address, user_agent,
                    outcome, target_type, target_id, error_message
                )
                VALUES (
                    CAST(:occurredAt AS TIMESTAMPTZ), :requestId, :userId, :username,
                    CAST(:role AS jagoz.user_role), :action, :method, :path, :queryString,
                    :statusCode, :durationMs, :ipAddress, :userAgent, :outcome,
                    :targetType, :targetId, :errorMessage
                )
                """.trimIndent(),
            ).bind("occurredAt", auditLog.occurredAt.toString())
            .bind("requestId", auditLog.requestId)
            .bind("userId", auditLog.userId)
            .bind("username", auditLog.username)
            .bind("role", auditLog.role?.name)
            .bind("action", auditLog.action)
            .bind("method", auditLog.method)
            .bind("path", auditLog.path)
            .bind("queryString", auditLog.queryString)
            .bind("statusCode", auditLog.statusCode)
            .bind("durationMs", auditLog.durationMs)
            .bind("ipAddress", auditLog.ipAddress)
            .bind("userAgent", auditLog.userAgent)
            .bind("outcome", auditLog.outcome)
            .bind("targetType", auditLog.targetType)
            .bind("targetId", auditLog.targetId)
            .bind("errorMessage", auditLog.errorMessage)
            .executeAndReturnGeneratedKeys("audit_log_id")
            .mapTo(Long::class.java)
            .one()

    override fun findPage(
        limit: Int,
        offset: Int,
    ): List<AuditLog> =
        handle
            .createQuery(
                """
                SELECT *
                FROM jagoz.audit_log
                ORDER BY occurred_at DESC, audit_log_id DESC
                LIMIT :limit OFFSET :offset
                """.trimIndent(),
            ).bind("limit", limit)
            .bind("offset", offset)
            .mapTo(AuditLog::class.java)
            .list()

    override fun countAll(): Long =
        handle
            .createQuery("SELECT COUNT(*) FROM jagoz.audit_log")
            .mapTo(Long::class.java)
            .one()
}
