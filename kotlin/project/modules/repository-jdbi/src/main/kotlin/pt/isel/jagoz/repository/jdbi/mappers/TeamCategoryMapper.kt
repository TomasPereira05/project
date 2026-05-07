package pt.isel.jagoz.repository.jdbi.mappers

import org.jdbi.v3.core.mapper.RowMapper
import org.jdbi.v3.core.statement.StatementContext
import pt.isel.jagoz.domain.team.TeamCategory
import java.sql.ResultSet

class TeamCategoryMapper : RowMapper<TeamCategory> {
    override fun map(
        rs: ResultSet,
        ctx: StatementContext,
    ): TeamCategory =
        TeamCategory(
            teamId = rs.getLong("team_category_id"),
            teamGroupId = rs.getLong("team_group_id"),
            code = rs.getString("code"),
            label = rs.getString("label"),
            active = rs.getBoolean("active"),
            sortOrder = rs.getInt("sort_order"),
        )
}
