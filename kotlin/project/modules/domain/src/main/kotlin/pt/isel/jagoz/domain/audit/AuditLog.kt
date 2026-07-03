package pt.isel.jagoz.domain.audit

import kotlinx.datetime.Instant
import pt.isel.jagoz.domain.user.Role

data class AuditLog(
    val auditLogId: Long,
    val occurredAt: Instant,
    val requestId: String,
    val userId: Long?,
    val username: String?,
    val role: Role?,
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
