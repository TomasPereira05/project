package pt.isel.jagoz.repository.jdbi.mappers

import org.jdbi.v3.core.mapper.RowMapper
import org.jdbi.v3.core.statement.StatementContext
import pt.isel.jagoz.domain.team.TeamGroupPrice
import java.sql.ResultSet

class TeamGroupPriceMapper : RowMapper<TeamGroupPrice> {
    override fun map(
        rs: ResultSet,
        ctx: StatementContext,
    ): TeamGroupPrice =
        TeamGroupPrice(
            teamGroupId = rs.getLong("team_group_id"),
            placementId = rs.getLong("placement_id"),
            price = rs.getInt("price"),
        )
}
