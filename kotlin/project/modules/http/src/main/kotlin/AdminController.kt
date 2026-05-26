package pt.isel.jagoz.http

import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RestController
import pt.isel.jagoz.domain.sponsor.SponsorError
import pt.isel.jagoz.domain.user.AuthenticatedUser
import pt.isel.jagoz.domain.utils.handle
import pt.isel.jagoz.http.utils.Problem
import pt.isel.jagoz.http.utils.Uris
import pt.isel.jagoz.service.AdminOverviewService

@RestController
class AdminController(
    private val adminOverviewService: AdminOverviewService,
) {
    @GetMapping(Uris.Admin.OVERVIEW_STATS)
    fun getOverviewStats(authenticatedUser: AuthenticatedUser): ResponseEntity<*> =
        adminOverviewService.getStats(authenticatedUser).handle(
            onFailure = { handleAdminError(it) },
            onSuccess = { ResponseEntity.ok(it) },
        )

    private fun handleAdminError(error: SponsorError): ResponseEntity<Any> =
        when (error) {
            is SponsorError.DomainError -> Problem.Unauthorized(error.message).response(HttpStatus.FORBIDDEN)
            is SponsorError.InvalidTransition -> Problem.InvalidOperation("admin", error.attempted).response(HttpStatus.BAD_REQUEST)
            is SponsorError.ValidationError -> Problem.InvalidOperation("admin", error.message).response(HttpStatus.BAD_REQUEST)
        }
}
