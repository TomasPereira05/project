package pt.isel.mappers

import pt.isel.sponsor.Sponsor
import java.sql.ResultSet

object SponsorMapper {
    fun map(rs: ResultSet): Sponsor =
        Sponsor(
            sponsorId = rs.getLong("sponsor_id"),
            name = rs.getString("name"),
            email = rs.getString("email"),
            phone = rs.getString("phone"),
            nif = rs.getString("nif"),
        )
}

