package pt.isel.jagoz.repository.jdbi

import org.jdbi.v3.core.Handle
import pt.isel.jagoz.domain.sponsor.TeamSponsorshipPrice
import pt.isel.jagoz.repository.TeamSponsorshipPriceRepository

class JdbiTeamSponsorshipPriceRepository(
    private val handle: Handle,
) : TeamSponsorshipPriceRepository {
    override fun findAll(): List<TeamSponsorshipPrice> =
        handle.createQuery(
            """
            SELECT id, team_category_id, placement_id, price
            FROM jagoz.team_sponsorship_price
            ORDER BY team_category_id, placement_id
            """,
        )
            .map { rs, _ ->
                TeamSponsorshipPrice(
                    id = rs.getLong("id"),
                    teamCategoryId = rs.getLong("team_category_id"),
                    placementId = rs.getLong("placement_id"),
                    price = rs.getInt("price"),
                )
            }
            .list()

    override fun findById(id: Long): TeamSponsorshipPrice? =
        handle.createQuery(
            """
            SELECT id, team_category_id, placement_id, price
            FROM jagoz.team_sponsorship_price
            WHERE id = :id
            """,
        )
            .bind("id", id)
            .map { rs, _ ->
                TeamSponsorshipPrice(
                    id = rs.getLong("id"),
                    teamCategoryId = rs.getLong("team_category_id"),
                    placementId = rs.getLong("placement_id"),
                    price = rs.getInt("price"),
                )
            }
            .findOne()
            .orElse(null)

    override fun findByTeamCategoryAndPlacement(
        teamCategoryId: Long,
        placementId: Long,
    ): TeamSponsorshipPrice? =
        handle.createQuery(
            """
            SELECT id, team_category_id, placement_id, price
            FROM jagoz.team_sponsorship_price
            WHERE team_category_id = :teamCategoryId
              AND placement_id = :placementId
            """,
        )
            .bind("teamCategoryId", teamCategoryId)
            .bind("placementId", placementId)
            .map { rs, _ ->
                TeamSponsorshipPrice(
                    id = rs.getLong("id"),
                    teamCategoryId = rs.getLong("team_category_id"),
                    placementId = rs.getLong("placement_id"),
                    price = rs.getInt("price"),
                )
            }
            .findOne()
            .orElse(null)

    override fun save(price: TeamSponsorshipPrice): Long =
        handle.createUpdate(
            """
            INSERT INTO jagoz.team_sponsorship_price (team_category_id, placement_id, price)
            VALUES (:teamCategoryId, :placementId, :price)
            """,
        )
            .bind("teamCategoryId", price.teamCategoryId)
            .bind("placementId", price.placementId)
            .bind("price", price.price)
            .executeAndReturnGeneratedKeys()
            .mapTo(Long::class.java)
            .one()

    override fun update(price: TeamSponsorshipPrice) {
        handle.createUpdate(
            """
            UPDATE jagoz.team_sponsorship_price
            SET team_category_id = :teamCategoryId,
                placement_id = :placementId,
                price = :price
            WHERE id = :id
            """,
        )
            .bind("id", price.id)
            .bind("teamCategoryId", price.teamCategoryId)
            .bind("placementId", price.placementId)
            .bind("price", price.price)
            .execute()
    }
}
