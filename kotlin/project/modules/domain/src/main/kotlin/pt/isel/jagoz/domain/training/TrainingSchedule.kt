package pt.isel.jagoz.domain.training

data class TrainingSchedule(
    val trainingScheduleId: Long,
    val teamCategoryId: Long,
    val season: String,
    val weekday: Int,
    val startTime: String,
    val endTime: String,
    val fieldName: String,
    val fieldZone: String?,
    val active: Boolean,
    val notes: String?,
)

data class TrainingScheduleWithTeam(
    val schedule: TrainingSchedule,
    val teamLabel: String,
    val teamCode: String,
)

sealed class TrainingScheduleError {
    data class DomainError(
        val message: String,
    ) : TrainingScheduleError()

    data class ValidationError(
        val message: String,
    ) : TrainingScheduleError()
}
