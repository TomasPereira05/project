package pt.isel.jagoz.http

import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RestController
import pt.isel.jagoz.domain.season.SeasonError
import pt.isel.jagoz.domain.user.AuthenticatedUser
import pt.isel.jagoz.domain.utils.handle
import pt.isel.jagoz.http.model.season.SeasonInput
import pt.isel.jagoz.http.model.season.toDomain
import pt.isel.jagoz.http.model.season.toOutput
import pt.isel.jagoz.http.utils.Problem
import pt.isel.jagoz.http.utils.Uris
import pt.isel.jagoz.service.SeasonService

@RestController
class SeasonController(
    private val seasonService: SeasonService,
) {
    @GetMapping(Uris.Seasons.GET_ALL)
    fun getSeasons(authenticatedUser: AuthenticatedUser): ResponseEntity<*> =
        seasonService.getSeasons(authenticatedUser).handle(
            onFailure = { handleSeasonError(it) },
            onSuccess = { seasons -> ResponseEntity.ok(seasons.map { it.toOutput() }) },
        )

    @GetMapping(Uris.Seasons.ACTIVE)
    fun getActiveSeason(): ResponseEntity<*> =
        seasonService.getActiveSeason().handle(
            onFailure = { handleSeasonError(it) },
            onSuccess = { ResponseEntity.ok(it.toOutput()) },
        )

    @PostMapping(Uris.Seasons.CREATE)
    fun createSeason(
        authenticatedUser: AuthenticatedUser,
        @RequestBody input: SeasonInput,
    ): ResponseEntity<*> =
        seasonService.createSeason(authenticatedUser, input.toDomain()).handle(
            onFailure = { handleSeasonError(it) },
            onSuccess = { ResponseEntity.status(HttpStatus.CREATED).body(it.toOutput()) },
        )

    @PutMapping(Uris.Seasons.UPDATE)
    fun updateSeason(
        authenticatedUser: AuthenticatedUser,
        @PathVariable seasonId: Long,
        @RequestBody input: SeasonInput,
    ): ResponseEntity<*> =
        seasonService.updateSeason(authenticatedUser, seasonId, input.toDomain(seasonId)).handle(
            onFailure = { handleSeasonError(it) },
            onSuccess = { ResponseEntity.ok(it.toOutput()) },
        )

    @PutMapping(Uris.Seasons.ACTIVATE)
    fun activateSeason(
        authenticatedUser: AuthenticatedUser,
        @PathVariable seasonId: Long,
    ): ResponseEntity<*> =
        seasonService.setActiveSeason(authenticatedUser, seasonId).handle(
            onFailure = { handleSeasonError(it) },
            onSuccess = { ResponseEntity.ok(it.toOutput()) },
        )

    private fun handleSeasonError(error: SeasonError): ResponseEntity<Any> =
        when (error) {
            is SeasonError.ValidationError -> Problem.ValidationError(error.message).response(HttpStatus.BAD_REQUEST)
            is SeasonError.DomainError ->
                when {
                    error.message.contains("not authorized", ignoreCase = true) ->
                        Problem.Unauthorized(error.message).response(HttpStatus.UNAUTHORIZED)
                    error.message.contains("not found", ignoreCase = true) ->
                        Problem.ValidationError(error.message).response(HttpStatus.NOT_FOUND)
                    else -> Problem.ValidationError(error.message).response(HttpStatus.BAD_REQUEST)
                }
        }
}
