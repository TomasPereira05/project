package pt.isel.jagoz.repository.jdbi.mappers

import org.jdbi.v3.core.mapper.RowMapper
import org.jdbi.v3.core.statement.StatementContext
import pt.isel.jagoz.domain.sponsor.Sponsor
import java.sql.ResultSet

class SponsorMapper : RowMapper<Sponsor> {
    override fun map(
        rs: ResultSet,
        ctx: StatementContext,
    ): Sponsor =
        Sponsor(
            sponsorId = rs.getLong("sponsor_id"),
            name = rs.getString("name"),
            email = rs.getString("email"),
            phone = rs.getString("phone"),
            nif = rs.getString("nif"),
        )
}
