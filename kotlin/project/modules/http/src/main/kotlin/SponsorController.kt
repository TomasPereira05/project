package pt.isel.jagoz.http

import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RestController
import pt.isel.jagoz.domain.sponsor.Sponsor
import pt.isel.jagoz.domain.sponsor.SponsorError
import pt.isel.jagoz.domain.utils.handle
import pt.isel.jagoz.http.utils.Problem
import pt.isel.jagoz.http.utils.Uris
import pt.isel.jagoz.service.SponsorService

@RestController
class SponsorController(
    private val sponsorService: SponsorService,
) {
    @GetMapping(Uris.Sponsors.GET_ALL)
    fun getAllSponsors(): ResponseEntity<List<Sponsor>> = ResponseEntity.ok(sponsorService.getAllSponsors())

    @GetMapping(Uris.Sponsors.GET_BY_ID)
    fun getSponsorById(
        @PathVariable sponsorId: Long,
    ): ResponseEntity<*> =
        sponsorService.getSponsorById(sponsorId).handle(
            onFailure = { handleSponsorError(it) },
            onSuccess = { ResponseEntity.ok(it) },
        )

    @PostMapping(Uris.Sponsors.CREATE)
    fun createSponsor(
        @RequestBody sponsor: Sponsor,
    ): ResponseEntity<*> =
        sponsorService.createSponsor(sponsor).handle(
            onFailure = { handleSponsorError(it) },
            onSuccess = { ResponseEntity.status(HttpStatus.CREATED).body(it) },
        )

    @PutMapping(Uris.Sponsors.UPDATE)
    fun updateSponsor(
        @PathVariable sponsorId: Long,
        @RequestBody sponsor: Sponsor,
    ): ResponseEntity<*> =
        sponsorService.updateSponsor(
            sponsorId = sponsorId,
            name = sponsor.name,
            email = sponsor.email,
            phone = sponsor.phone,
            nif = sponsor.nif,
        ).handle(
            onFailure = { handleSponsorError(it) },
            onSuccess = { ResponseEntity.ok(it) },
        )

    private fun handleSponsorError(error: SponsorError): ResponseEntity<Any> =
        when (error) {
            is SponsorError.ValidationError -> Problem.ValidationError(error.message).response(HttpStatus.BAD_REQUEST)
            is SponsorError.InvalidTransition -> Problem.InvalidTransition(error.from.toString(), error.attempted).response(HttpStatus.BAD_REQUEST)
            is SponsorError.DomainError ->
                if (error.message.contains("not found", ignoreCase = true)) {
                    Problem.SponsorNotFound(error.message).response(HttpStatus.NOT_FOUND)
                } else {
                    Problem.ValidationError(error.message).response(HttpStatus.BAD_REQUEST)
                }
        }
}
