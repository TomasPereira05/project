package pt.isel.jagoz.repository.jdbi

import org.jdbi.v3.core.Handle
import pt.isel.jagoz.repository.SponsorshipRepository
import pt.isel.jagoz.repository.jdbi.mappers.SponsorshipMapper
import pt.isel.jagoz.sponsor.Sponsorship

class JdbiSponsorshipRepository(private val handle: Handle) : SponsorshipRepository {
    override fun findById(id: Long): Sponsorship? {
        return handle.createQuery("SELECT * FROM sponsorship WHERE sponsorship_id = :id")
            .bind("id", id)
            .map { rs, _ -> SponsorshipMapper.map(rs) }
            .findOne()
            .orElse(null)
    }

    override fun findBySponsorId(sponsorId: Long): List<Sponsorship> {
        return handle.createQuery("SELECT * FROM sponsorship WHERE sponsor_id = :sponsorId")
            .bind("sponsorId", sponsorId)
            .map { rs, _ -> SponsorshipMapper.map(rs) }
            .list()
    }

    override fun save(sponsorship: Sponsorship): Long {
        return handle.createUpdate(
            """
            INSERT INTO sponsorship (sponsor_id, season, status, type, price, pub_option, team_category, placement, sport)
            VALUES (:sponsorId, :season, CAST(:status AS sponsorship_status), CAST(:type AS sponsor_type), :price, 
                    CAST(:pubOption AS pub_option), CAST(:teamCategory AS team_category), CAST(:placement AS equipment_placement), CAST(:sport AS other_sport))
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
            UPDATE sponsorship SET
                sponsor_id = :sponsorId,
                season = :season,
                status = CAST(:status AS sponsorship_status),
                type = CAST(:type AS sponsor_type),
                price = :price,
                pub_option = CAST(:pubOption AS pub_option),
                team_category = CAST(:teamCategory AS team_category),
                placement = CAST(:placement AS equipment_placement),
                sport = CAST(:sport AS other_sport)
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
