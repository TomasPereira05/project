package pt.isel.jagoz.repository.jdbi

import org.jdbi.v3.core.Handle
import pt.isel.jagoz.domain.sponsor.Sponsorship
import pt.isel.jagoz.repository.SponsorshipRepository

class JdbiSponsorshipRepository(private val handle: Handle) : SponsorshipRepository {
    override fun findById(id: Long): Sponsorship? {
        return handle.createQuery("SELECT * FROM jagoz.sponsorship WHERE sponsorship_id = :id")
            .bind("id", id)
            .mapTo(Sponsorship::class.java)
            .findOne()
            .orElse(null)
    }

    override fun findBySponsorId(sponsorId: Long): List<Sponsorship> {
        return handle.createQuery("SELECT * FROM jagoz.sponsorship WHERE sponsor_id = :sponsorId")
            .bind("sponsorId", sponsorId)
            .mapTo(Sponsorship::class.java)
            .list()
    }

    override fun save(sponsorship: Sponsorship): Long {
        return handle.createUpdate(
            """
            INSERT INTO jagozsponsorship (sponsor_id, season, status, type, price, pub_option, team_category, placement, sport)
            VALUES (:sponsorId, :season, CAST(:status AS jagoz.sponsorship_status), CAST(:type AS jagoz.sponsor_type), :price, 
                    CAST(:pubOption AS jagoz.pub_option), CAST(:teamCategory AS jagoz.team_category), CAST(:placement AS jagoz.equipment_placement), CAST(:sport AS jagoz.other_sport))
            """,
        )
            .bind("sponsorId", sponsorship.sponsorId)
            .bind("season", sponsorship.season)
            .bind("status", sponsorship.status.name)
            .bind("type", sponsorship.type.name)
            .bind("price", sponsorship.price)
            .bind("pubOption", sponsorship.pubOption?.name)
            .bind("teamCategory", sponsorship.teamCategory?.name)
            .bind("placement", sponsorship.placement?.name)
            .bind("sport", sponsorship.sport?.name)
            .executeAndReturnGeneratedKeys()
            .mapTo(Long::class.java)
            .one()
    }

    override fun update(sponsorship: Sponsorship) {
        handle.createUpdate(
            """
            UPDATE jagoz.sponsorship SET
                sponsor_id = :sponsorId,
                season = :season,
                status = CAST(:status AS jagoz.sponsorship_status),
                type = CAST(:type AS jagoz.sponsor_type),
                price = :price,
                pub_option = CAST(:pubOption AS jagoz.pub_option),
                team_category = CAST(:teamCategory AS jagoz.team_category),
                placement = CAST(:placement AS jagoz.equipment_placement),
                sport = CAST(:sport AS jagoz.other_sport)
            WHERE sponsorship_id = :id
            """,
        )
            .bind("id", sponsorship.sponsorshipId)
            .bind("sponsorId", sponsorship.sponsorId)
            .bind("season", sponsorship.season)
            .bind("status", sponsorship.status.name)
            .bind("type", sponsorship.type.name)
            .bind("price", sponsorship.price)
            .bind("pubOption", sponsorship.pubOption?.name)
            .bind("teamCategory", sponsorship.teamCategory?.name)
            .bind("placement", sponsorship.placement?.name)
            .bind("sport", sponsorship.sport?.name)
            .execute()
    }
}
