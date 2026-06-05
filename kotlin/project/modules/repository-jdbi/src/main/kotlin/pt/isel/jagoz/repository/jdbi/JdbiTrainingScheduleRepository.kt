package pt.isel.jagoz.repository.jdbi

import org.jdbi.v3.core.Handle
import org.jdbi.v3.core.statement.Update
import pt.isel.jagoz.domain.training.TrainingSchedule
import pt.isel.jagoz.domain.training.TrainingScheduleWithTeam
import pt.isel.jagoz.repository.TrainingScheduleRepository
import java.sql.ResultSet

class JdbiTrainingScheduleRepository(
    private val handle: Handle,
) : TrainingScheduleRepository {
    override fun findAll(
        season: String?,
        activeOnly: Boolean,
    ): List<TrainingScheduleWithTeam> =
        findFiltered(
            season = season,
            activeOnly = activeOnly,
            teamCategoryId = null,
        )

    override fun findByTeamCategoryId(
        teamCategoryId: Long,
        season: String?,
        activeOnly: Boolean,
    ): List<TrainingScheduleWithTeam> =
        findFiltered(
            season = season,
            activeOnly = activeOnly,
            teamCategoryId = teamCategoryId,
        )

    override fun findById(trainingScheduleId: Long): TrainingSchedule? =
        handle
            .createQuery(
                """
                SELECT *
                FROM jagoz.training_schedule
                WHERE training_schedule_id = :trainingScheduleId
                """.trimIndent(),
            ).bind("trainingScheduleId", trainingScheduleId)
            .map { rs, _ -> mapSchedule(rs) }
            .findOne()
            .orElse(null)

    override fun save(schedule: TrainingSchedule): Long =
        handle
            .createUpdate(
                """
                INSERT INTO jagoz.training_schedule (
                    team_category_id, season, weekday, start_time, end_time,
                    field_name, field_zone, active, notes
                )
                VALUES (
                    :teamCategoryId, :season, :weekday, :startTime, :endTime,
                    :fieldName, :fieldZone, :active, :notes
                )
                """.trimIndent(),
            ).bindSchedule(schedule)
            .executeAndReturnGeneratedKeys("training_schedule_id")
            .mapTo(Long::class.java)
            .one()

    override fun update(schedule: TrainingSchedule) {
        handle
            .createUpdate(
                """
                UPDATE jagoz.training_schedule
                SET team_category_id = :teamCategoryId,
                    season = :season,
                    weekday = :weekday,
                    start_time = :startTime,
                    end_time = :endTime,
                    field_name = :fieldName,
                    field_zone = :fieldZone,
                    active = :active,
                    notes = :notes
                WHERE training_schedule_id = :trainingScheduleId
                """.trimIndent(),
            ).bindSchedule(schedule)
            .bind("trainingScheduleId", schedule.trainingScheduleId)
            .execute()
    }

    override fun setActive(
        trainingScheduleId: Long,
        active: Boolean,
    ) {
        handle
            .createUpdate(
                """
                UPDATE jagoz.training_schedule
                SET active = :active
                WHERE training_schedule_id = :trainingScheduleId
                """.trimIndent(),
            ).bind("trainingScheduleId", trainingScheduleId)
            .bind("active", active)
            .execute()
    }

    private fun findFiltered(
        season: String?,
        activeOnly: Boolean,
        teamCategoryId: Long?,
    ): List<TrainingScheduleWithTeam> {
        val conditions = mutableListOf<String>()
        val bindings = mutableMapOf<String, Any>()

        season?.takeIf { it.isNotBlank() }?.let {
            conditions.add("ts.season = :season")
            bindings["season"] = it
        }

        if (activeOnly) {
            conditions.add("ts.active = true")
        }

        teamCategoryId?.let {
            conditions.add("ts.team_category_id = :teamCategoryId")
            bindings["teamCategoryId"] = it
        }

        val whereClause = conditions.takeIf { it.isNotEmpty() }?.joinToString(" AND ", "WHERE ") ?: ""

        return handle
            .createQuery(
                """
                SELECT
                    ts.*,
                    tc.label AS team_label,
                    tc.code AS team_code
                FROM jagoz.training_schedule ts
                JOIN jagoz.team_category tc ON tc.team_category_id = ts.team_category_id
                $whereClause
                ORDER BY ts.weekday ASC, ts.start_time ASC, ts.end_time ASC, tc.sort_order ASC, tc.label ASC
                """.trimIndent(),
            ).bindMap(bindings)
            .map { rs, _ ->
                TrainingScheduleWithTeam(
                    schedule = mapSchedule(rs),
                    teamLabel = rs.getString("team_label"),
                    teamCode = rs.getString("team_code"),
                )
            }.list()
    }

    private fun mapSchedule(rs: ResultSet): TrainingSchedule =
        TrainingSchedule(
            trainingScheduleId = rs.getLong("training_schedule_id"),
            teamCategoryId = rs.getLong("team_category_id"),
            season = rs.getString("season"),
            weekday = rs.getInt("weekday"),
            startTime = rs.getString("start_time"),
            endTime = rs.getString("end_time"),
            fieldName = rs.getString("field_name"),
            fieldZone = rs.getString("field_zone"),
            active = rs.getBoolean("active"),
            notes = rs.getString("notes"),
        )

    private fun Update.bindSchedule(schedule: TrainingSchedule): Update =
        bind("teamCategoryId", schedule.teamCategoryId)
            .bind("season", schedule.season)
            .bind("weekday", schedule.weekday)
            .bind("startTime", schedule.startTime)
            .bind("endTime", schedule.endTime)
            .bind("fieldName", schedule.fieldName)
            .bind("fieldZone", schedule.fieldZone)
            .bind("active", schedule.active)
            .bind("notes", schedule.notes)
}
