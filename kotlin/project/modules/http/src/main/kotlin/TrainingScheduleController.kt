package pt.isel.jagoz.http

import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import pt.isel.jagoz.domain.training.TrainingScheduleError
import pt.isel.jagoz.domain.user.AuthenticatedUser
import pt.isel.jagoz.domain.utils.handle
import pt.isel.jagoz.http.model.training.TrainingScheduleInput
import pt.isel.jagoz.http.model.training.toDomain
import pt.isel.jagoz.http.model.training.toOutput
import pt.isel.jagoz.http.utils.Problem
import pt.isel.jagoz.http.utils.Uris
import pt.isel.jagoz.service.TrainingScheduleService

@RestController
class TrainingScheduleController(
    private val trainingScheduleService: TrainingScheduleService,
) {
    @GetMapping(Uris.TrainingSchedules.GET_ALL)
    fun getSchedules(
        authenticatedUser: AuthenticatedUser,
        @RequestParam(required = false) season: String?,
        @RequestParam(defaultValue = "true") activeOnly: Boolean,
    ): ResponseEntity<*> =
        trainingScheduleService.getSchedules(authenticatedUser, season, activeOnly).handle(
            onFailure = { handleTrainingScheduleError(it) },
            onSuccess = { schedules -> ResponseEntity.ok(schedules.map { it.toOutput() }) },
        )

    @GetMapping(Uris.TrainingSchedules.GET_BY_TEAM_CATEGORY)
    fun getPublicTeamSchedules(
        @PathVariable teamCategoryId: Long,
        @RequestParam(required = false) season: String?,
    ): ResponseEntity<*> =
        trainingScheduleService.getPublicTeamSchedules(teamCategoryId, season).handle(
            onFailure = { handleTrainingScheduleError(it) },
            onSuccess = { schedules -> ResponseEntity.ok(schedules.map { it.toOutput() }) },
        )

    @PostMapping(Uris.TrainingSchedules.CREATE)
    fun createSchedule(
        authenticatedUser: AuthenticatedUser,
        @RequestBody input: TrainingScheduleInput,
    ): ResponseEntity<*> =
        trainingScheduleService.createSchedule(authenticatedUser, input.toDomain()).handle(
            onFailure = { handleTrainingScheduleError(it) },
            onSuccess = { ResponseEntity.status(HttpStatus.CREATED).body(it.toOutput()) },
        )

    @PutMapping(Uris.TrainingSchedules.UPDATE)
    fun updateSchedule(
        authenticatedUser: AuthenticatedUser,
        @PathVariable trainingScheduleId: Long,
        @RequestBody input: TrainingScheduleInput,
    ): ResponseEntity<*> =
        trainingScheduleService.updateSchedule(authenticatedUser, trainingScheduleId, input.toDomain(trainingScheduleId)).handle(
            onFailure = { handleTrainingScheduleError(it) },
            onSuccess = { ResponseEntity.ok(it.toOutput()) },
        )

    @DeleteMapping(Uris.TrainingSchedules.DEACTIVATE)
    fun deactivateSchedule(
        authenticatedUser: AuthenticatedUser,
        @PathVariable trainingScheduleId: Long,
    ): ResponseEntity<*> =
        trainingScheduleService.setActive(authenticatedUser, trainingScheduleId, false).handle(
            onFailure = { handleTrainingScheduleError(it) },
            onSuccess = { ResponseEntity.ok(it.toOutput()) },
        )

    @PutMapping(Uris.TrainingSchedules.REACTIVATE)
    fun reactivateSchedule(
        authenticatedUser: AuthenticatedUser,
        @PathVariable trainingScheduleId: Long,
    ): ResponseEntity<*> =
        trainingScheduleService.setActive(authenticatedUser, trainingScheduleId, true).handle(
            onFailure = { handleTrainingScheduleError(it) },
            onSuccess = { ResponseEntity.ok(it.toOutput()) },
        )

    private fun handleTrainingScheduleError(error: TrainingScheduleError): ResponseEntity<Any> =
        when (error) {
            is TrainingScheduleError.ValidationError -> Problem.ValidationError(error.message).response(HttpStatus.BAD_REQUEST)
            is TrainingScheduleError.DomainError ->
                when {
                    error.message.contains("not authorized", ignoreCase = true) ->
                        Problem.Unauthorized(error.message).response(HttpStatus.UNAUTHORIZED)
                    error.message.contains("not found", ignoreCase = true) ->
                        Problem.ValidationError(error.message).response(HttpStatus.NOT_FOUND)
                    else -> Problem.ValidationError(error.message).response(HttpStatus.BAD_REQUEST)
                }
        }
}
