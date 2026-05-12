package pt.isel.jagoz.repository.jdbi.mappers

import org.jdbi.v3.core.mapper.RowMapper
import org.jdbi.v3.core.statement.StatementContext
import pt.isel.jagoz.domain.team.TeamCategoryPriceOverride
import java.sql.ResultSet

class TeamCategoryPriceOverrideMapper : RowMapper<TeamCategoryPriceOverride> {
    override fun map(
        rs: ResultSet,
        ctx: StatementContext,
    ): TeamCategoryPriceOverride =
        TeamCategoryPriceOverride(
            teamCategoryId = rs.getLong("team_category_id"),
            placementId = rs.getLong("placement_id"),
            price = rs.getInt("price"),
        )
}
