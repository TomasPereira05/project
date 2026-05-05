package pt.isel.jagoz.repository.jdbi

import org.jdbi.v3.core.Handle
import pt.isel.jagoz.domain.sponsor.Sponsorship
import pt.isel.jagoz.domain.sponsor.SponsorshipStatus
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
        INSERT INTO jagoz.sponsorship (
            sponsor_id,
            season,
            status,
            type,
            price,
            pub_option_id,
            team_category_id,
            placement_id,
            sport_id
        )
        VALUES (
            :sponsorId,
            :season,
            CAST(:status AS jagoz.sponsorship_status),
            CAST(:type AS jagoz.sponsor_type),
            :price,
            :pubOptionId,
            :teamCategoryId,
            :placementId,
            :sportId
        )
        """
        )
            .bind("sponsorId", sponsorship.sponsorId)
            .bind("season", sponsorship.season)
            .bind("status", sponsorship.status.name)
            .bind("type", sponsorship.type.name)
            .bind("price", sponsorship.price)
            .bind("pubOptionId", sponsorship.pubOptionId)
            .bind("teamCategoryId", sponsorship.teamCategoryId)
            .bind("placementId", sponsorship.placementId)
            .bind("sportId", sponsorship.sportId)

            .executeAndReturnGeneratedKeys()
            .mapTo(Long::class.java)
            .one()
    }

    override fun updateStatus(id: Long, status: SponsorshipStatus) {
        TODO("Not yet implemented")
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
            pub_option_id = :pubOptionId,
            team_category_id = :teamCategoryId,
            placement_id = :placementId,
            sport_id = :sportId
        WHERE sponsorship_id = :id
        """
        )
            .bind("id", sponsorship.sponsorshipId)
            .bind("sponsorId", sponsorship.sponsorId)
            .bind("season", sponsorship.season)
            .bind("status", sponsorship.status.name)
            .bind("type", sponsorship.type.name)
            .bind("price", sponsorship.price)

            .bind("pubOptionId", sponsorship.pubOptionId)
            .bind("teamCategoryId", sponsorship.teamCategoryId)
            .bind("placementId", sponsorship.placementId)
            .bind("sportId", sponsorship.sportId)

            .execute()
    }

    override fun deleteById(id: Long) {
        TODO("Not yet implemented")
    }

    override fun existsById(id: Long): Boolean {
        TODO("Not yet implemented")
    }
}
