package pt.isel.jagoz.http

import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import pt.isel.jagoz.domain.sponsor.SponsorError
import pt.isel.jagoz.domain.user.AuthenticatedUser
import pt.isel.jagoz.domain.utils.handle
import pt.isel.jagoz.http.model.admin.toOutput
import pt.isel.jagoz.http.utils.Problem
import pt.isel.jagoz.http.utils.Uris
import pt.isel.jagoz.service.AdminOverviewService
import pt.isel.jagoz.service.AuditLogError
import pt.isel.jagoz.service.AuditLogService
import pt.isel.jagoz.service.Page

@RestController
class AdminController(
    private val adminOverviewService: AdminOverviewService,
    private val auditLogService: AuditLogService,
) {
    @GetMapping(Uris.Admin.OVERVIEW_STATS)
    fun getOverviewStats(authenticatedUser: AuthenticatedUser): ResponseEntity<*> =
        adminOverviewService.getStats(authenticatedUser).handle(
            onFailure = { handleAdminError(it) },
            onSuccess = { ResponseEntity.ok(it) },
        )

    @GetMapping(Uris.Admin.AUDIT_LOGS)
    fun getAuditLogs(
        authenticatedUser: AuthenticatedUser,
        @RequestParam(defaultValue = "1") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
    ): ResponseEntity<*> =
        auditLogService.getAuditLogs(authenticatedUser, page, size).handle(
            onFailure = { handleAuditLogError(it) },
            onSuccess = { auditPage ->
                ResponseEntity.ok(
                    Page(
                        items = auditPage.items.map { it.toOutput() },
                        page = auditPage.page,
                        size = auditPage.size,
                        total = auditPage.total,
                        totalPages = auditPage.totalPages,
                    ),
                )
            },
        )

    private fun handleAdminError(error: SponsorError): ResponseEntity<Any> =
        when (error) {
            is SponsorError.DomainError -> Problem.Unauthorized(error.message).response(HttpStatus.FORBIDDEN)
            is SponsorError.InvalidTransition -> Problem.InvalidOperation("admin", error.attempted).response(HttpStatus.BAD_REQUEST)
            is SponsorError.ValidationError -> Problem.InvalidOperation("admin", error.message).response(HttpStatus.BAD_REQUEST)
        }

    private fun handleAuditLogError(error: AuditLogError): ResponseEntity<Any> =
        when (error) {
            is AuditLogError.DomainError ->
                if (error.message.contains("not authorized", ignoreCase = true)) {
                    Problem.Unauthorized(error.message).response(HttpStatus.FORBIDDEN)
                } else {
                    Problem.ValidationError(error.message).response(HttpStatus.BAD_REQUEST)
                }
        }
}
