package pt.isel.jagoz.repository

import pt.isel.jagoz.domain.training.TrainingSchedule
import pt.isel.jagoz.domain.training.TrainingScheduleWithTeam

interface TrainingScheduleRepository {
    fun findAll(
        season: String?,
        activeOnly: Boolean,
    ): List<TrainingScheduleWithTeam>

    fun findByTeamCategoryId(
        teamCategoryId: Long,
        season: String?,
        activeOnly: Boolean,
    ): List<TrainingScheduleWithTeam>

    fun findById(trainingScheduleId: Long): TrainingSchedule?

    fun save(schedule: TrainingSchedule): Long

    fun update(schedule: TrainingSchedule)

    fun setActive(
        trainingScheduleId: Long,
        active: Boolean,
    )
}
