package pt.isel.jagoz.repository.jdbi.mappers

import org.jdbi.v3.core.mapper.RowMapper
import org.jdbi.v3.core.statement.StatementContext
import pt.isel.jagoz.domain.sponsor.OtherSport
import java.sql.ResultSet

class OtherSportMapper : RowMapper<OtherSport> {
    override fun map(rs: ResultSet, ctx: StatementContext): OtherSport =
        OtherSport(
            sportId = rs.getLong("sport_id"),
            code = rs.getString("code"),
            label = rs.getString("label"),
            active = rs.getBoolean("active"),
            sortOrder = rs.getInt("sort_order")
        )
}