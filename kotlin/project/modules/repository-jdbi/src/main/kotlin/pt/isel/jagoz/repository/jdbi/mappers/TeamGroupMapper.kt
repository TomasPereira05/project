package pt.isel.jagoz.repository.jdbi.mappers

import org.jdbi.v3.core.mapper.RowMapper
import org.jdbi.v3.core.statement.StatementContext
import pt.isel.jagoz.domain.team.TeamGroup
import java.sql.ResultSet

class TeamGroupMapper : RowMapper<TeamGroup> {
    override fun map(
        rs: ResultSet,
        ctx: StatementContext,
    ): TeamGroup =
        TeamGroup(
            teamGroupId = rs.getLong("team_group_id"),
            code = rs.getString("code"),
            label = rs.getString("label"),
            active = rs.getBoolean("active"),
            sortOrder = rs.getInt("sort_order"),
        )
}
