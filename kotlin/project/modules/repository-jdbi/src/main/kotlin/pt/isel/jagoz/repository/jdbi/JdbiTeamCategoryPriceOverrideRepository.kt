package pt.isel.jagoz.repository.jdbi

import org.jdbi.v3.core.Handle
import pt.isel.jagoz.domain.team.TeamCategoryPriceOverride
import pt.isel.jagoz.repository.TeamCategoryPriceOverrideRepository

class JdbiTeamCategoryPriceOverrideRepository(private val handle: Handle) : TeamCategoryPriceOverrideRepository {
    override fun find(
        categoryId: Long,
        placementId: Long,
    ): TeamCategoryPriceOverride? {
        return handle.createQuery(
            """
             SELECT team_category_id, placement_id, price
             FROM jagoz.team_category_price_override
             WHERE team_category_id = :categoryId
             AND placement_id = :placementId
             """,
        )
            .bind("categoryId", categoryId)
            .bind("placementId", placementId)
            .map { rs, _ ->
                TeamCategoryPriceOverride(
                    teamCategoryId = rs.getLong("team_category_id"),
                    placementId = rs.getLong("placement_id"),
                    price = rs.getInt("price"),
                )
            }
            .findOne()
            .orElse(null)
    }

    override fun findAll(): List<TeamCategoryPriceOverride> {
        return handle.createQuery(
            """
        SELECT team_category_id, placement_id, price
        FROM jagoz.team_group_price
        ORDER BY team_category_id, placement_id
        """,
        )
            .map { rs, _ ->
                TeamCategoryPriceOverride(
                    teamCategoryId = rs.getLong("team_category_id"),
                    placementId = rs.getLong("placement_id"),
                    price = rs.getInt("price"),
                )
            }
            .list()
    }

    override fun save(
        categoryId: Long,
        placementId: Long,
        price: Int,
    ) {
        handle.createUpdate(
            """
        INSERT INTO jagoz.team_category_price_override (team_category_id, placement_id, price)
        VALUES (:categoryId, :placementId, :price)
        """,
        )
            .bind("categoryId", categoryId)
            .bind("placementId", placementId)
            .bind("price", price)
            .execute()
    }

    override fun update(
        categoryId: Long,
        placementId: Long,
        price: Int,
    ) {
        handle.createUpdate(
            """
        UPDATE jagoz.team_category_price_override
        SET price = :price
        WHERE team_category_id = :categoryId
          AND placement_id = :placementId
        """,
        )
            .bind("categoryId", categoryId)
            .bind("placementId", placementId)
            .bind("price", price)
            .execute()
    }

    override fun delete(
        categoryId: Long,
        placementId: Long,
    ) {
        handle.createUpdate(
            """
        DELETE FROM jagoz.team_category_price_override
        WHERE team_category_id = :categoryId
          AND placement_id = :placementId
        """,
        )
            .bind("categoryId", categoryId)
            .bind("placementId", placementId)
            .execute()
    }
}
