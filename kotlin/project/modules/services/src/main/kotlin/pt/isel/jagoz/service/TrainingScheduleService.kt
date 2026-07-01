package pt.isel.jagoz.service

import jakarta.inject.Named
import pt.isel.jagoz.domain.training.TrainingSchedule
import pt.isel.jagoz.domain.training.TrainingScheduleError
import pt.isel.jagoz.domain.training.TrainingScheduleWithTeam
import pt.isel.jagoz.domain.user.AuthenticatedUser
import pt.isel.jagoz.domain.user.canManageBackoffice
import pt.isel.jagoz.domain.utils.Either
import pt.isel.jagoz.domain.utils.failure
import pt.isel.jagoz.domain.utils.success
import pt.isel.jagoz.repository.TransactionManager

typealias TrainingScheduleResult = Either<TrainingScheduleError, TrainingScheduleWithTeam>
typealias TrainingScheduleListResult = Either<TrainingScheduleError, List<TrainingScheduleWithTeam>>

@Named
class TrainingScheduleService(
    private val transactionManager: TransactionManager,
) {
    fun getSchedules(
        authenticatedUser: AuthenticatedUser,
        season: String?,
        activeOnly: Boolean,
    ): TrainingScheduleListResult {
        if (!authenticatedUser.canManageBackoffice()) {
            return failure(TrainingScheduleError.DomainError("Not authorized"))
        }

        return transactionManager.run { transaction ->
            success(transaction.trainingScheduleRepository.findAll(season?.trim(), activeOnly))
        }
    }

    fun getPublicTeamSchedules(
        teamCategoryId: Long,
        season: String?,
    ): TrainingScheduleListResult =
        transactionManager.run { transaction ->
            transaction.teamCategoryRepository.findById(teamCategoryId)
                ?: return@run failure(TrainingScheduleError.DomainError("Team category $teamCategoryId not found"))

            success(
                transaction.trainingScheduleRepository.findByTeamCategoryId(
                    teamCategoryId = teamCategoryId,
                    season = season?.trim(),
                    activeOnly = true,
                ),
            )
        }

    fun createSchedule(
        authenticatedUser: AuthenticatedUser,
        schedule: TrainingSchedule,
    ): TrainingScheduleResult {
        if (!authenticatedUser.canManageBackoffice()) {
            return failure(TrainingScheduleError.DomainError("Not authorized"))
        }

        return transactionManager.run { transaction ->
            validateSchedule(schedule)?.let { return@run failure(it) }

            transaction.teamCategoryRepository.findById(schedule.teamCategoryId)
                ?: return@run failure(TrainingScheduleError.DomainError("Team category ${schedule.teamCategoryId} not found"))

            if (hasConflict(schedule, transaction.trainingScheduleRepository.findAll(schedule.season, true))) {
                return@run failure(TrainingScheduleError.ValidationError("Training schedule conflicts with another active schedule"))
            }

            val scheduleToSave =
                schedule.copy(
                    trainingScheduleId = 0,
                    season = schedule.season.trim(),
                    startTime = schedule.startTime.trim(),
                    endTime = schedule.endTime.trim(),
                    fieldName = schedule.fieldName.trim(),
                    fieldZone = schedule.fieldZone?.trim()?.takeIf { it.isNotEmpty() },
                    notes = schedule.notes?.trim()?.takeIf { it.isNotEmpty() },
                )
            val id = transaction.trainingScheduleRepository.save(scheduleToSave)
            val created =
                transaction.trainingScheduleRepository
                    .findAll(scheduleToSave.season, false)
                    .first { it.schedule.trainingScheduleId == id }
            success(created)
        }
    }

    fun updateSchedule(
        authenticatedUser: AuthenticatedUser,
        trainingScheduleId: Long,
        schedule: TrainingSchedule,
    ): TrainingScheduleResult {
        if (!authenticatedUser.canManageBackoffice()) {
            return failure(TrainingScheduleError.DomainError("Not authorized"))
        }

        return transactionManager.run { transaction ->
            transaction.trainingScheduleRepository.findById(trainingScheduleId)
                ?: return@run failure(TrainingScheduleError.DomainError("Training schedule $trainingScheduleId not found"))

            val candidate = schedule.copy(trainingScheduleId = trainingScheduleId)
            validateSchedule(candidate)?.let { return@run failure(it) }

            transaction.teamCategoryRepository.findById(candidate.teamCategoryId)
                ?: return@run failure(TrainingScheduleError.DomainError("Team category ${candidate.teamCategoryId} not found"))

            if (hasConflict(candidate, transaction.trainingScheduleRepository.findAll(candidate.season, true))) {
                return@run failure(TrainingScheduleError.ValidationError("Training schedule conflicts with another active schedule"))
            }

            val updated =
                candidate.copy(
                    season = candidate.season.trim(),
                    startTime = candidate.startTime.trim(),
                    endTime = candidate.endTime.trim(),
                    fieldName = candidate.fieldName.trim(),
                    fieldZone = candidate.fieldZone?.trim()?.takeIf { it.isNotEmpty() },
                    notes = candidate.notes?.trim()?.takeIf { it.isNotEmpty() },
                )
            transaction.trainingScheduleRepository.update(updated)
            val output =
                transaction.trainingScheduleRepository
                    .findAll(updated.season, false)
                    .first { it.schedule.trainingScheduleId == trainingScheduleId }
            success(output)
        }
    }

    fun setActive(
        authenticatedUser: AuthenticatedUser,
        trainingScheduleId: Long,
        active: Boolean,
    ): TrainingScheduleResult {
        if (!authenticatedUser.canManageBackoffice()) {
            return failure(TrainingScheduleError.DomainError("Not authorized"))
        }

        return transactionManager.run { transaction ->
            val schedule =
                transaction.trainingScheduleRepository.findById(trainingScheduleId)
                    ?: return@run failure(TrainingScheduleError.DomainError("Training schedule $trainingScheduleId not found"))

            if (active) {
                val candidate = schedule.copy(active = true)
                if (hasConflict(candidate, transaction.trainingScheduleRepository.findAll(candidate.season, true))) {
                    return@run failure(TrainingScheduleError.ValidationError("Training schedule conflicts with another active schedule"))
                }
            }

            transaction.trainingScheduleRepository.setActive(trainingScheduleId, active)
            val output =
                transaction.trainingScheduleRepository
                    .findAll(schedule.season, false)
                    .first { it.schedule.trainingScheduleId == trainingScheduleId }
            success(output)
        }
    }

    private fun validateSchedule(schedule: TrainingSchedule): TrainingScheduleError? {
        if (schedule.season.trim().isEmpty()) {
            return TrainingScheduleError.ValidationError("Season is required")
        }
        if (schedule.weekday !in 1..7) {
            return TrainingScheduleError.ValidationError("Weekday must be between 1 and 7")
        }
        if (!TIME_REGEX.matches(schedule.startTime.trim()) || !TIME_REGEX.matches(schedule.endTime.trim())) {
            return TrainingScheduleError.ValidationError("Times must use HH:mm format")
        }
        if (toMinutes(schedule.startTime) >= toMinutes(schedule.endTime)) {
            return TrainingScheduleError.ValidationError("Start time must be before end time")
        }
        if (schedule.fieldName.trim().isEmpty()) {
            return TrainingScheduleError.ValidationError("Field name is required")
        }
        return null
    }

    private fun hasConflict(
        candidate: TrainingSchedule,
        schedules: List<TrainingScheduleWithTeam>,
    ): Boolean =
        schedules.any { existing ->
            val schedule = existing.schedule
            schedule.trainingScheduleId != candidate.trainingScheduleId &&
                schedule.active &&
                candidate.active &&
                schedule.season == candidate.season &&
                schedule.weekday == candidate.weekday &&
                schedule.fieldName.equals(candidate.fieldName, ignoreCase = true) &&
                (schedule.fieldZone ?: "").equals(candidate.fieldZone ?: "", ignoreCase = true) &&
                toMinutes(candidate.startTime) < toMinutes(schedule.endTime) &&
                toMinutes(candidate.endTime) > toMinutes(schedule.startTime)
        }

    private fun toMinutes(time: String): Int {
        val (hours, minutes) = time.trim().split(":").map { it.toInt() }
        return hours * 60 + minutes
    }

    companion object {
        private val TIME_REGEX = Regex("^([01][0-9]|2[0-3]):[0-5][0-9]$")
    }
}
