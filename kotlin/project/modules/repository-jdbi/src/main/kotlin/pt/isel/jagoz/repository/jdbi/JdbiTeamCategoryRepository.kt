package pt.isel.jagoz.repository.jdbi

import org.jdbi.v3.core.Handle
import pt.isel.jagoz.domain.sponsor.TeamCategory
import pt.isel.jagoz.repository.TeamCategoryRepository

class JdbiTeamCategoryRepository(private val handle: Handle): TeamCategoryRepository {
    override fun findAll(): List<TeamCategory> {
        return handle.createQuery(
            """
        SELECT *
        FROM jagoz.team_category
        ORDER BY sort_order ASC
        """
        )
            .mapTo(TeamCategory::class.java)
            .list()
    }

    override fun findById(id: Long): TeamCategory? {
        return handle.createQuery(
            """
        SELECT *
        FROM jagoz.team_category
        WHERE team_category_id = :id
        """
        )
            .bind("id", id)
            .mapTo(TeamCategory::class.java)
            .findOne()
            .orElse(null)
    }

    override fun findActive(): List<TeamCategory> {
        return handle.createQuery(
            """
        SELECT *
        FROM jagoz.team_category
        WHERE active = true
        ORDER BY sort_order ASC
        """
        )
            .mapTo(TeamCategory::class.java)
            .list()
    }

    override fun save(team: TeamCategory): Long {
        return handle.createUpdate(
            """
        INSERT INTO jagoz.team_category (code, label, active, sort_order)
        VALUES (:code, :label, :active, :sortOrder)
        """
        )
            .bind("code", team.code)
            .bind("label", team.label)
            .bind("active", team.active)
            .bind("sortOrder", team.sortOrder)
            .executeAndReturnGeneratedKeys()
            .mapTo(Long::class.java)
            .one()
    }

    override fun update(team: TeamCategory) {
        handle.createUpdate(
            """
        UPDATE jagoz.team_category SET
            code = :code,
            label = :label,
            active = :active,
            sort_order = :sortOrder
        WHERE team_category_id = :id
        """
        )
            .bind("id", team.teamId)
            .bind("code", team.code)
            .bind("label", team.label)
            .bind("active", team.active)
            .bind("sortOrder", team.sortOrder)
            .execute()
    }

    override fun deactivate(id: Long) {
        handle.createUpdate(
            """
        UPDATE jagoz.team_category
        SET active = false
        WHERE team_category_id = :id
        """
        )
            .bind("id", id)
            .execute()
    }
}