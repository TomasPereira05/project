package pt.isel.mappers

import pt.isel.sponsor.EquipmentPlacement
import pt.isel.sponsor.OtherSport
import pt.isel.sponsor.PubOption
import pt.isel.sponsor.SponsorType
import pt.isel.sponsor.Sponsorship
import pt.isel.sponsor.SponsorshipStatus
import pt.isel.sponsor.TeamCategory
import java.sql.ResultSet

object SponsorshipMapper {
    fun map(rs: ResultSet): Sponsorship =
        Sponsorship(
            sponsorshipId = rs.getLong("sponsorship_id"),
            sponsorId = rs.getLong("sponsor_id"),
            season = rs.getString("season"),
            status = SponsorshipStatus.valueOf(rs.getString("status")),
            type = SponsorType.valueOf(rs.getString("type")),
            price = rs.getDouble("price"),
            pubOption = rs.getString("pub_option")?.let(PubOption::valueOf),
            teamCategory = rs.getString("team_category")?.let(TeamCategory::valueOf),
            placement = rs.getString("placement")?.let(EquipmentPlacement::valueOf),
            sport = rs.getString("sport")?.let(OtherSport::valueOf),
        )
}

