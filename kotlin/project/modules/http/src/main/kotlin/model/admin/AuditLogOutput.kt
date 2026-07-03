package pt.isel.jagoz.http.model.admin

import pt.isel.jagoz.domain.audit.AuditLog

data class AuditLogOutput(
    val auditLogId: Long,
    val occurredAt: String,
    val requestId: String,
    val userId: Long?,
    val username: String?,
    val role: String?,
    val action: String,
    val method: String,
    val path: String,
    val queryString: String?,
    val statusCode: Int,
    val durationMs: Long,
    val ipAddress: String?,
    val userAgent: String?,
    val outcome: String,
    val targetType: String?,
    val targetId: String?,
    val errorMessage: String?,
)

fun AuditLog.toOutput(): AuditLogOutput =
    AuditLogOutput(
        auditLogId = auditLogId,
        occurredAt = occurredAt.toString(),
        requestId = requestId,
        userId = userId,
        username = username,
        role = role?.name,
        action = action,
        method = method,
        path = path,
        queryString = queryString,
        statusCode = statusCode,
        durationMs = durationMs,
        ipAddress = ipAddress,
        userAgent = userAgent,
        outcome = outcome,
        targetType = targetType,
        targetId = targetId,
        errorMessage = errorMessage,
    )
