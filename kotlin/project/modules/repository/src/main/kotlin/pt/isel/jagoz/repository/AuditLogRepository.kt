package pt.isel.jagoz.repository

import pt.isel.jagoz.domain.audit.AuditLog

interface AuditLogRepository {
    fun save(auditLog: AuditLog): Long

    fun findPage(
        limit: Int,
        offset: Int,
    ): List<AuditLog>

    fun countAll(): Long
}
