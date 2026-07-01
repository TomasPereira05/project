package pt.isel.jagoz.http.model.training

import pt.isel.jagoz.domain.training.TrainingSchedule
import pt.isel.jagoz.domain.training.TrainingScheduleWithTeam

data class TrainingScheduleInput(
    val trainingScheduleId: Long = 0,
    val teamCategoryId: Long,
    val season: String,
    val weekday: Int,
    val startTime: String,
    val endTime: String,
    val fieldName: String,
    val fieldZone: String?,
    val active: Boolean = true,
    val notes: String?,
)

data class TrainingScheduleOutput(
    val trainingScheduleId: Long,
    val teamCategoryId: Long,
    val teamLabel: String,
    val teamCode: String,
    val season: String,
    val weekday: Int,
    val startTime: String,
    val endTime: String,
    val fieldName: String,
    val fieldZone: String?,
    val active: Boolean,
    val notes: String?,
)

fun TrainingScheduleInput.toDomain(id: Long = trainingScheduleId): TrainingSchedule =
    TrainingSchedule(
        trainingScheduleId = id,
        teamCategoryId = teamCategoryId,
        season = season,
        weekday = weekday,
        startTime = startTime,
        endTime = endTime,
        fieldName = fieldName,
        fieldZone = fieldZone,
        active = active,
        notes = notes,
    )

fun TrainingScheduleWithTeam.toOutput(): TrainingScheduleOutput =
    TrainingScheduleOutput(
        trainingScheduleId = schedule.trainingScheduleId,
        teamCategoryId = schedule.teamCategoryId,
        teamLabel = teamLabel,
        teamCode = teamCode,
        season = schedule.season,
        weekday = schedule.weekday,
        startTime = schedule.startTime,
        endTime = schedule.endTime,
        fieldName = schedule.fieldName,
        fieldZone = schedule.fieldZone,
        active = schedule.active,
        notes = schedule.notes,
    )
