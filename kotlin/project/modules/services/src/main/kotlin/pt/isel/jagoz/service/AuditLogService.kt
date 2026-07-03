package pt.isel.jagoz.service

import jakarta.inject.Named
import pt.isel.jagoz.domain.audit.AuditLog
import pt.isel.jagoz.domain.user.AuthenticatedUser
import pt.isel.jagoz.domain.user.canManageBackoffice
import pt.isel.jagoz.domain.utils.Either
import pt.isel.jagoz.domain.utils.failure
import pt.isel.jagoz.domain.utils.success
import pt.isel.jagoz.repository.TransactionManager

typealias AuditLogPageResult = Either<AuditLogError, Page<AuditLog>>

sealed class AuditLogError {
    data class DomainError(
        val message: String,
    ) : AuditLogError()
}

@Named
class AuditLogService(
    private val transactionManager: TransactionManager,
) {
    fun getAuditLogs(
        authenticatedUser: AuthenticatedUser,
        page: Int,
        size: Int,
    ): AuditLogPageResult {
        if (!authenticatedUser.canManageBackoffice()) {
            return failure(AuditLogError.DomainError("Not authorized"))
        }

        val request = pageRequest(page, size)
        return transactionManager.run { transaction ->
            success(
                pageOf(
                    items = transaction.auditLogRepository.findPage(request.size, request.offset),
                    request = request,
                    total = transaction.auditLogRepository.countAll(),
                ),
            )
        }
    }
}
