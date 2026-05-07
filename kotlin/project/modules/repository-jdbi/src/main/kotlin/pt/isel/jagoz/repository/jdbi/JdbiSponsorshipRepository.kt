package pt.isel.jagoz.repository.jdbi

import org.jdbi.v3.core.Handle
import pt.isel.jagoz.domain.sponsor.Sponsorship
import pt.isel.jagoz.domain.sponsor.SponsorshipStatus
import pt.isel.jagoz.repository.SponsorshipRepository

class JdbiSponsorshipRepository(private val handle: Handle) : SponsorshipRepository {
    override fun findById(id: Long): Sponsorship? {
        return handle.createQuery(
            """
            SELECT s.*,
                   COALESCE(tsp.price, pop.price, osp.price) AS price
            FROM jagoz.sponsorship s
            LEFT JOIN jagoz.team_sponsorship_price tsp ON tsp.id = s.team_price_id
            LEFT JOIN jagoz.pub_option_price pop ON pop.pub_option_id = s.pub_price_id
            LEFT JOIN jagoz.other_sport_price osp ON osp.sport_id = s.sport_price_id
            WHERE s.sponsorship_id = :id
            """,
        )
            .bind("id", id)
            .mapTo(Sponsorship::class.java)
            .findOne()
            .orElse(null)
    }

    override fun findBySponsorId(sponsorId: Long): List<Sponsorship> {
        return handle.createQuery(
            """
            SELECT s.*,
                   COALESCE(tsp.price, pop.price, osp.price) AS price
            FROM jagoz.sponsorship s
            LEFT JOIN jagoz.team_sponsorship_price tsp ON tsp.id = s.team_price_id
            LEFT JOIN jagoz.pub_option_price pop ON pop.pub_option_id = s.pub_price_id
            LEFT JOIN jagoz.other_sport_price osp ON osp.sport_id = s.sport_price_id
            WHERE s.sponsor_id = :sponsorId
            ORDER BY s.sponsorship_id DESC
            """,
        )
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
            team_price_id,
            pub_price_id,
            sport_price_id,
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
            :teamPriceId,
            :pubPriceId,
            :sportPriceId,
            :pubOptionId,
            :teamCategoryId,
            :placementId,
            :sportId
        )
        """,
        )
            .bind("sponsorId", sponsorship.sponsorId)
            .bind("season", sponsorship.season)
            .bind("status", sponsorship.status.name)
            .bind("type", sponsorship.type.name)
            .bind("teamPriceId", sponsorship.teamPriceId)
            .bind("pubPriceId", sponsorship.pubPriceId)
            .bind("sportPriceId", sponsorship.sportPriceId)
            .bind("pubOptionId", sponsorship.pubOptionId)
            .bind("teamCategoryId", sponsorship.teamCategoryId)
            .bind("placementId", sponsorship.placementId)
            .bind("sportId", sponsorship.sportId)
            .executeAndReturnGeneratedKeys()
            .mapTo(Long::class.java)
            .one()
    }

    override fun updateStatus(
        id: Long,
        status: SponsorshipStatus,
    ) {
        handle.createUpdate(
            """
            UPDATE jagoz.sponsorship
            SET status = CAST(:status AS jagoz.sponsorship_status)
            WHERE sponsorship_id = :id
            """,
        )
            .bind("id", id)
            .bind("status", status.name)
            .execute()
    }

    override fun update(sponsorship: Sponsorship) {
        handle.createUpdate(
            """
        UPDATE jagoz.sponsorship SET
            sponsor_id = :sponsorId,
            season = :season,
            status = CAST(:status AS jagoz.sponsorship_status),
            type = CAST(:type AS jagoz.sponsor_type),
            team_price_id = :teamPriceId,
            pub_price_id = :pubPriceId,
            sport_price_id = :sportPriceId,
            pub_option_id = :pubOptionId,
            team_category_id = :teamCategoryId,
            placement_id = :placementId,
            sport_id = :sportId
        WHERE sponsorship_id = :id
        """,
        )
            .bind("id", sponsorship.sponsorshipId)
            .bind("sponsorId", sponsorship.sponsorId)
            .bind("season", sponsorship.season)
            .bind("status", sponsorship.status.name)
            .bind("type", sponsorship.type.name)
            .bind("teamPriceId", sponsorship.teamPriceId)
            .bind("pubPriceId", sponsorship.pubPriceId)
            .bind("sportPriceId", sponsorship.sportPriceId)
            .bind("pubOptionId", sponsorship.pubOptionId)
            .bind("teamCategoryId", sponsorship.teamCategoryId)
            .bind("placementId", sponsorship.placementId)
            .bind("sportId", sponsorship.sportId)
            .execute()
    }

    override fun deleteById(id: Long) {
        handle.createUpdate("DELETE FROM jagoz.sponsorship WHERE sponsorship_id = :id")
            .bind("id", id)
            .execute()
    }

    override fun existsById(id: Long): Boolean {
        return handle.createQuery("SELECT EXISTS (SELECT 1 FROM jagoz.sponsorship WHERE sponsorship_id = :id)")
            .bind("id", id)
            .mapTo(Boolean::class.java)
            .one()
    }
}
