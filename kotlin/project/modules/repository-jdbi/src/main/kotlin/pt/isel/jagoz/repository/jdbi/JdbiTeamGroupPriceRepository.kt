package pt.isel.jagoz.repository.jdbi

import org.jdbi.v3.core.Handle
import pt.isel.jagoz.domain.team.TeamGroupPrice
import pt.isel.jagoz.repository.TeamGroupPriceRepository

class JdbiTeamGroupPriceRepository(private val handle: Handle) : TeamGroupPriceRepository {
    override fun find(
        groupId: Long,
        placementId: Long,
    ): TeamGroupPrice? {
        return handle.createQuery(
            """
             SELECT team_group_id, placement_id, price
             FROM jagoz.team_group_price
             WHERE team_group_id = :groupId
             AND placement_id = :placementId
             """,
        )
            .bind("groupId", groupId)
            .bind("placementId", placementId)
            .mapTo(TeamGroupPrice::class.java)
            .findOne()
            .orElse(null)
    }

    override fun findAll(): List<TeamGroupPrice> {
        return handle.createQuery(
            """
        SELECT team_group_id, placement_id, price
        FROM jagoz.team_group_price
        ORDER BY team_group_id, placement_id
        """,
        )
            .mapTo(TeamGroupPrice::class.java)
            .list()
    }

    override fun save(
        groupId: Long,
        placementId: Long,
        price: Int,
    ) {
        handle.createUpdate(
            """
        INSERT INTO jagoz.team_group_price (team_group_id, placement_id, price)
        VALUES (:groupId, :placementId, :price)
        """,
        )
            .bind("groupId", groupId)
            .bind("placementId", placementId)
            .bind("price", price)
            .execute()
    }

    override fun update(
        groupId: Long,
        placementId: Long,
        price: Int,
    ) {
        handle.createUpdate(
            """
        UPDATE jagoz.team_group_price
        SET price = :price
        WHERE team_group_id = :groupId
          AND placement_id = :placementId
        """,
        )
            .bind("groupId", groupId)
            .bind("placementId", placementId)
            .bind("price", price)
            .execute()
    }
}
