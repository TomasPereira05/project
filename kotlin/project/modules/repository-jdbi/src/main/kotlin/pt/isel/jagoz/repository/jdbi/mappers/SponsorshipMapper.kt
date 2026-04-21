package pt.isel.jagoz.repository.jdbi.mappers

import org.jdbi.v3.core.mapper.RowMapper
import org.jdbi.v3.core.statement.StatementContext
import pt.isel.jagoz.domain.sponsor.EquipmentPlacement
import pt.isel.jagoz.domain.sponsor.OtherSport
import pt.isel.jagoz.domain.sponsor.PubOption
import pt.isel.jagoz.domain.sponsor.SponsorType
import pt.isel.jagoz.domain.sponsor.Sponsorship
import pt.isel.jagoz.domain.sponsor.SponsorshipStatus
import pt.isel.jagoz.domain.sponsor.TeamCategory
import java.sql.ResultSet

class SponsorshipMapper : RowMapper<Sponsorship> {
    override fun map(
        rs: ResultSet,
        ctx: StatementContext,
    ): Sponsorship =
        Sponsorship(
            sponsorshipId = rs.getLong("sponsorship_id"),
            sponsorId = rs.getLong("sponsor_id"),
            season = rs.getString("season"),
            status = SponsorshipStatus.valueOf(rs.getString("status")),
            type = SponsorType.valueOf(rs.getString("type")),
            price = rs.getInt("price"),
            pubOption = rs.getString("pub_option")?.let(PubOption::valueOf),
            teamCategory = rs.getString("team_category")?.let(TeamCategory::valueOf),
            placement = rs.getString("placement")?.let(EquipmentPlacement::valueOf),
            sport = rs.getString("sport")?.let(OtherSport::valueOf),
        )
}
