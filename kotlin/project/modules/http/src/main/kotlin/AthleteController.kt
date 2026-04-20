package pt.isel.jagoz.http

import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RestController
import pt.isel.jagoz.domain.athlete.Athlete
import pt.isel.jagoz.domain.athlete.AthleteError
import pt.isel.jagoz.domain.utils.handle
import pt.isel.jagoz.http.model.athlete.CategoryRequest
import pt.isel.jagoz.http.model.athlete.SchoolInfoRequest
import pt.isel.jagoz.http.utils.Problem
import pt.isel.jagoz.http.utils.Uris
import pt.isel.jagoz.service.AthleteService

@RestController
class AthleteController(
    private val athleteService: AthleteService,
) {
    @GetMapping(Uris.Athletes.GET_BY_ID)
    fun getAthleteById(
        @PathVariable athleteId: Long,
    ): ResponseEntity<*> =
        athleteService.getAthleteById(athleteId).handle(
            onFailure = { error -> handleAthleteError(error) },
            onSuccess = { res -> ResponseEntity.ok(res) },
        )

    @GetMapping(Uris.Athletes.GET_BY_MEMBER_ID)
    fun getAthleteByMemberId(
        @PathVariable memberId: Long,
    ): ResponseEntity<*> =
        athleteService.getAthleteByMemberId(memberId).handle(
            onFailure = { error -> handleAthleteError(error) },
            onSuccess = { res -> ResponseEntity.ok(res) },
        )

    @GetMapping(Uris.Athletes.GET_ACTIVE_ATHLETES)
            fun getAllActiveAthletes(): ResponseEntity<List<Athlete>> {
                val athletes = athleteService.getAllActiveAthletes()
                return ResponseEntity.ok(athletes)
            }

    @PostMapping(Uris.Athletes.CREATE_ATHLETE)
    fun createAthlete(
        @RequestBody athlete: Athlete,
    ): ResponseEntity<*> =
        athleteService.createAthlete(athlete).handle(
            onFailure = { error -> handleAthleteError(error) },
            onSuccess = { res ->
                ResponseEntity
                    .created(Uris.Athletes.byId(res.athleteId))
                    .body(res)
            },
        )

    @PutMapping(Uris.Athletes.CHANGE_TEAM_CATEGORY)
    fun changeTeamCategory(
        @PathVariable athleteId: Long,
        @RequestBody categoryRequest: CategoryRequest,
    ): ResponseEntity<*> =
        athleteService.changeTeamCategory(athleteId, categoryRequest.category).handle(
            onFailure = { error -> handleAthleteError(error) },
            onSuccess = { res -> ResponseEntity.ok(res) },
        )

    @DeleteMapping(Uris.Athletes.DEACTIVATE_ATHLETE)
    fun deactivateAthlete(
        @PathVariable athleteId: Long,
    ): ResponseEntity<*> =
        athleteService.markInactive(athleteId).handle(
            onFailure = { error -> handleAthleteError(error) },
            onSuccess = { res -> ResponseEntity.ok(res) },
        )

    @PutMapping(Uris.Athletes.REACTIVATE_ATHLETE)
    fun reactivateAthlete(
        @PathVariable athleteId: Long,
    ): ResponseEntity<*> =
        athleteService.reactivate(athleteId).handle(
            onFailure = { error -> handleAthleteError(error) },
            onSuccess = { res -> ResponseEntity.ok(res) },
        )

    @PutMapping(Uris.Athletes.UPDATE_SCHOOL_INFO)
    fun updateSchoolInfo(
        @PathVariable athleteId: Long,
        @RequestBody request: SchoolInfoRequest,
    ): ResponseEntity<*> =
        athleteService
            .updateSchoolInfo(athleteId, request.school, request.schoolYear, request.schoolClass)
            .handle(
            onFailure = { error -> handleAthleteError(error) },
            onSuccess = { res -> ResponseEntity.ok(res) },
        )

    private fun handleAthleteError(error: AthleteError): ResponseEntity<Any> {
        return when (error) {
            is AthleteError.NotFound -> Problem.AthleteNotFound(error.field, error.value).response(HttpStatus.NOT_FOUND)
            is AthleteError.DomainError -> Problem.ValidationError(error.message).response(HttpStatus.BAD_REQUEST)
            is AthleteError.ValidationError -> Problem.ValidationError(error.message).response(HttpStatus.BAD_REQUEST)
            is AthleteError.InvalidOperation ->
                Problem.InvalidOperation(
                    "athlete-operation",
                    error.message,
                ).response(HttpStatus.BAD_REQUEST)
        }
    }
}
