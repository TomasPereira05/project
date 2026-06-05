package pt.isel.jagoz.repository.jdbi

import kotlinx.datetime.LocalDate
import org.jdbi.v3.core.Handle
import org.jdbi.v3.core.statement.Update
import pt.isel.jagoz.domain.season.Season
import pt.isel.jagoz.repository.SeasonRepository
import java.sql.ResultSet

class JdbiSeasonRepository(
    private val handle: Handle,
) : SeasonRepository {
    override fun findAll(): List<Season> =
        handle
            .createQuery(
                """
                SELECT *
                FROM jagoz.club_season
                ORDER BY starts_at DESC, name DESC
                """.trimIndent(),
            ).map { rs, _ -> mapSeason(rs) }
            .list()

    override fun findActive(): Season? =
        handle
            .createQuery(
                """
                SELECT *
                FROM jagoz.club_season
                WHERE active = true
                LIMIT 1
                """.trimIndent(),
            ).map { rs, _ -> mapSeason(rs) }
            .findOne()
            .orElse(null)

    override fun findById(seasonId: Long): Season? =
        handle
            .createQuery(
                """
                SELECT *
                FROM jagoz.club_season
                WHERE season_id = :seasonId
                """.trimIndent(),
            ).bind("seasonId", seasonId)
            .map { rs, _ -> mapSeason(rs) }
            .findOne()
            .orElse(null)

    override fun findByName(name: String): Season? =
        handle
            .createQuery(
                """
                SELECT *
                FROM jagoz.club_season
                WHERE lower(name) = lower(:name)
                """.trimIndent(),
            ).bind("name", name)
            .map { rs, _ -> mapSeason(rs) }
            .findOne()
            .orElse(null)

    override fun save(season: Season): Long =
        handle
            .createUpdate(
                """
                INSERT INTO jagoz.club_season (name, starts_at, ends_at, active)
                VALUES (:name, :startsAt, :endsAt, :active)
                """.trimIndent(),
            ).bindSeason(season)
            .executeAndReturnGeneratedKeys("season_id")
            .mapTo(Long::class.java)
            .one()

    override fun update(season: Season) {
        handle
            .createUpdate(
                """
                UPDATE jagoz.club_season
                SET name = :name,
                    starts_at = :startsAt,
                    ends_at = :endsAt,
                    active = :active
                WHERE season_id = :seasonId
                """.trimIndent(),
            ).bindSeason(season)
            .bind("seasonId", season.seasonId)
            .execute()
    }

    override fun setActive(seasonId: Long) {
        handle.createUpdate("UPDATE jagoz.club_season SET active = false").execute()
        handle
            .createUpdate(
                """
                UPDATE jagoz.club_season
                SET active = true
                WHERE season_id = :seasonId
                """.trimIndent(),
            ).bind("seasonId", seasonId)
            .execute()
    }

    private fun mapSeason(rs: ResultSet): Season =
        Season(
            seasonId = rs.getLong("season_id"),
            name = rs.getString("name"),
            startsAt = LocalDate.parse(rs.getString("starts_at")),
            endsAt = LocalDate.parse(rs.getString("ends_at")),
            active = rs.getBoolean("active"),
        )

    private fun Update.bindSeason(season: Season): Update =
        bind("name", season.name)
            .bind("startsAt", season.startsAt)
            .bind("endsAt", season.endsAt)
            .bind("active", season.active)
}
