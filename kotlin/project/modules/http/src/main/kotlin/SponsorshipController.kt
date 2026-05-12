package pt.isel.jagoz.http

import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import pt.isel.jagoz.domain.sponsor.SponsorError
import pt.isel.jagoz.domain.sponsor.Sponsorship
import pt.isel.jagoz.domain.user.AuthenticatedUser
import pt.isel.jagoz.domain.utils.handle
import pt.isel.jagoz.http.model.sponsor.SponsorSponsorshipRequest
import pt.isel.jagoz.http.utils.Problem
import pt.isel.jagoz.http.utils.Uris
import pt.isel.jagoz.service.SponsorshipService

@RestController
class SponsorshipController(
    private val sponsorshipService: SponsorshipService,
) {
    @PostMapping(Uris.Sponsorships.CREATE)
    fun createSponsorship(
        authenticatedUser: AuthenticatedUser,
        @RequestBody sponsorship: Sponsorship,
    ): ResponseEntity<*> =
        sponsorshipService.createSponsorship(authenticatedUser, sponsorship).handle(
            onFailure = { handleSponsorError(it) },
            onSuccess = { ResponseEntity.status(HttpStatus.CREATED).body(it) },
        )

    @PostMapping(Uris.Sponsorships.CREATE_WITH_SPONSOR)
    fun createSponsorshipWithSponsor(
        authenticatedUser: AuthenticatedUser,
        @RequestBody request: SponsorSponsorshipRequest,
    ): ResponseEntity<*> =
        sponsorshipService.createSponsorshipWithSponsor(authenticatedUser, request.sponsor, request.sponsorship, request.userId).handle(
            onFailure = { handleSponsorError(it) },
            onSuccess = { ResponseEntity.status(HttpStatus.CREATED).body(it) },
        )

    @GetMapping(Uris.Sponsorships.GET_ALL)
    fun getAllSponsorships(
        authenticatedUser: AuthenticatedUser,
        @RequestParam(defaultValue = "1") page: Int,
        @RequestParam(defaultValue = "8") size: Int,
    ): ResponseEntity<*> =
        sponsorshipService.getAllSponsorshipsWithSponsorsPage(authenticatedUser, page, size).handle(
            onFailure = { handleSponsorError(it) },
            onSuccess = { ResponseEntity.ok(it) },
        )

    @GetMapping(Uris.Sponsorships.MY)
    fun getMySponsorships(
        authenticatedUser: AuthenticatedUser,
        @RequestParam(defaultValue = "1") page: Int,
        @RequestParam(defaultValue = "8") size: Int,
    ): ResponseEntity<*> =
        sponsorshipService.getSponsorshipsForUserPage(authenticatedUser, page, size).handle(
            onFailure = { handleSponsorError(it) },
            onSuccess = { ResponseEntity.ok(it) },
        )

    @GetMapping(Uris.Sponsorships.GET_BY_ID)
    fun getSponsorshipById(
        @PathVariable sponsorshipId: Long,
        authenticatedUser: AuthenticatedUser,
    ): ResponseEntity<*> =
        sponsorshipService.getSponsorshipByIdForUser(sponsorshipId, authenticatedUser).handle(
            onFailure = { handleSponsorError(it) },
            onSuccess = { ResponseEntity.ok(it) },
        )

    @GetMapping(Uris.Sponsorships.GET_BY_SPONSOR)
    fun getSponsorshipsBySponsorId(
        @PathVariable sponsorId: Long,
        authenticatedUser: AuthenticatedUser,
        @RequestParam(defaultValue = "1") page: Int,
        @RequestParam(defaultValue = "8") size: Int,
    ): ResponseEntity<*> =
        sponsorshipService.getSponsorshipsBySponsorIdForUserPage(sponsorId, authenticatedUser, page, size).handle(
            onFailure = { handleSponsorError(it) },
            onSuccess = { ResponseEntity.ok(it) },
        )

    @PutMapping(Uris.Sponsorships.APPROVE)
    fun approveSponsorship(
        authenticatedUser: AuthenticatedUser,
        @PathVariable sponsorshipId: Long,
    ): ResponseEntity<*> =
        sponsorshipService.approveSponsorship(authenticatedUser, sponsorshipId).handle(
            onFailure = { handleSponsorError(it) },
            onSuccess = { ResponseEntity.ok(it) },
        )

    @PutMapping(Uris.Sponsorships.MARK_PAID)
    fun markSponsorshipPaid(
        authenticatedUser: AuthenticatedUser,
        @PathVariable sponsorshipId: Long,
    ): ResponseEntity<*> =
        sponsorshipService.markSponsorshipPaid(authenticatedUser, sponsorshipId).handle(
            onFailure = { handleSponsorError(it) },
            onSuccess = { ResponseEntity.ok(it) },
        )

    @PutMapping(Uris.Sponsorships.CANCEL)
    fun cancelSponsorship(
        authenticatedUser: AuthenticatedUser,
        @PathVariable sponsorshipId: Long,
    ): ResponseEntity<*> =
        sponsorshipService.cancelSponsorship(authenticatedUser, sponsorshipId).handle(
            onFailure = { handleSponsorError(it) },
            onSuccess = { ResponseEntity.ok(it) },
        )

    private fun handleSponsorError(error: SponsorError): ResponseEntity<Any> =
        when (error) {
            is SponsorError.ValidationError -> Problem.ValidationError(error.message).response(HttpStatus.BAD_REQUEST)
            is SponsorError.InvalidTransition -> Problem.InvalidTransition(error.from.toString(), error.attempted).response(HttpStatus.BAD_REQUEST)
            is SponsorError.DomainError ->
                when {
                    error.message.contains("not authorized", ignoreCase = true) ->
                        Problem.Unauthorized(error.message).response(HttpStatus.UNAUTHORIZED)
                    error.message.contains("sponsorship", ignoreCase = true) && error.message.contains("not found", ignoreCase = true) ->
                        Problem.SponsorshipNotFound(error.message).response(HttpStatus.NOT_FOUND)
                    error.message.contains("sponsor", ignoreCase = true) && error.message.contains("not found", ignoreCase = true) ->
                        Problem.SponsorNotFound(error.message).response(HttpStatus.NOT_FOUND)
                    error.message.contains("not found", ignoreCase = true) ->
                        Problem.ValidationError(error.message).response(HttpStatus.NOT_FOUND)
                    else -> Problem.ValidationError(error.message).response(HttpStatus.BAD_REQUEST)
                }
        }
}
