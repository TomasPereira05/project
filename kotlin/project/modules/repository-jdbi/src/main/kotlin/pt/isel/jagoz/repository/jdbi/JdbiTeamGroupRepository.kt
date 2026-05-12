package pt.isel.jagoz.repository.jdbi

import org.jdbi.v3.core.Handle
import pt.isel.jagoz.domain.team.TeamGroup
import pt.isel.jagoz.repository.TeamGroupRepository

class JdbiTeamGroupRepository(private val handle: Handle) : TeamGroupRepository {
    override fun findAll(): List<TeamGroup> {
        return handle.createQuery(
            """
            SELECT *
            FROM jagoz.team_group
            ORDER BY sort_order ASC
            """,
        )
            .mapTo(TeamGroup::class.java)
            .list()
    }

    override fun findById(id: Long): TeamGroup? {
        return handle.createQuery(
            """
            SELECT *
            FROM jagoz.team_group
            WHERE team_group_id = :id
            """,
        )
            .bind("id", id)
            .mapTo(TeamGroup::class.java)
            .findOne()
            .orElse(null)
    }

    override fun findActive(): List<TeamGroup> {
        return handle.createQuery(
            """
            SELECT *
            FROM jagoz.team_group
            WHERE active = true
            ORDER BY sort_order ASC
            """,
        )
            .mapTo(TeamGroup::class.java)
            .list()
    }

    override fun save(team: TeamGroup): Long {
        return handle.createUpdate(
            """
            INSERT INTO jagoz.team_group (
                code,
                label,
                active,
                sort_order
            )
            VALUES (
                :code,
                :label,
                :active,
                :sortOrder
            )
            """,
        )
            .bind("code", team.code)
            .bind("label", team.label)
            .bind("active", team.active)
            .bind("sortOrder", team.sortOrder)
            .executeAndReturnGeneratedKeys()
            .mapTo(Long::class.java)
            .one()
    }

    override fun update(team: TeamGroup) {
        handle.createUpdate(
            """
            UPDATE jagoz.team_group
            SET code = :code,
                label = :label,
                active = :active,
                sort_order = :sortOrder
            WHERE team_group_id = :id
            """,
        )
            .bind("id", team.teamGroupId)
            .bind("code", team.code)
            .bind("label", team.label)
            .bind("active", team.active)
            .bind("sortOrder", team.sortOrder)
            .execute()
    }

    override fun deactivate(id: Long) {
        handle.createUpdate(
            """
            UPDATE jagoz.team_group
            SET active = false
            WHERE team_group_id = :id
            """,
        )
            .bind("id", id)
            .execute()
    }

    override fun activate(id: Long) {
        handle.createUpdate(
            """
            UPDATE jagoz.team_group
            SET active = true
            WHERE team_group_id = :id
            """,
        )
            .bind("id", id)
            .execute()
    }
}
