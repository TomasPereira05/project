package pt.isel.jagoz.repository.jdbi.mappers

import org.jdbi.v3.core.mapper.RowMapper
import org.jdbi.v3.core.statement.StatementContext
import pt.isel.jagoz.domain.sponsor.PubOption
import java.sql.ResultSet

class PubOptionMapper : RowMapper<PubOption> {
    override fun map(
        rs: ResultSet,
        ctx: StatementContext,
    ): PubOption =
        PubOption(
            pubId = rs.getLong("pub_option_id"),
            code = rs.getString("code"),
            label = rs.getString("label"),
            active = rs.getBoolean("active"),
            available = rs.getInt("available"),
            free = rs.getInt("free"),
            occupied = rs.getInt("occupied"),
            price = rs.getInt("price"),
            sortOrder = (rs.getObject("sort_order") as? Number)?.toInt(),
        )
}
