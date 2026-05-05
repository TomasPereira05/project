package pt.isel.jagoz.repository.jdbi.mappers

import org.jdbi.v3.core.mapper.RowMapper
import org.jdbi.v3.core.statement.StatementContext
import pt.isel.jagoz.domain.sponsor.PubOption
import java.sql.ResultSet

class PubOptionMapper : RowMapper<PubOption> {
    override fun map(rs: ResultSet, ctx: StatementContext): PubOption =
        PubOption(
            pubId = rs.getLong("pub_option_id"),
            code = rs.getString("code"),
            label = rs.getString("label"),
            active = rs.getBoolean("active"),
            sortOrder = rs.getInt("sort_order"),
        )
}