package pt.isel.jagoz.repository.jdbi.mappers

import pt.isel.jagoz.sponsor.EquipmentPlacement
import pt.isel.jagoz.sponsor.OtherSport
import pt.isel.jagoz.sponsor.PubOption
import pt.isel.jagoz.sponsor.SponsorType
import pt.isel.jagoz.sponsor.Sponsorship
import pt.isel.jagoz.sponsor.SponsorshipStatus
import pt.isel.jagoz.sponsor.TeamCategory
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
