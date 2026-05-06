package pt.isel.jagoz.repository.jdbi

import org.jdbi.v3.core.Handle
import pt.isel.jagoz.domain.sponsor.OtherSportPrice
import pt.isel.jagoz.repository.OtherSportPriceRepository

class JdbiOtherSportPriceRepository(
    private val handle: Handle,
) : OtherSportPriceRepository {
    override fun findAll(): List<OtherSportPrice> =
        handle.createQuery(
            """
            SELECT sport_id, price
            FROM jagoz.other_sport_price
            ORDER BY sport_id
            """,
        )
            .map { rs, _ ->
                OtherSportPrice(
                    sportId = rs.getLong("sport_id"),
                    price = rs.getInt("price"),
                )
            }
            .list()

    override fun findBySportId(sportId: Long): OtherSportPrice? =
        handle.createQuery(
            """
            SELECT sport_id, price
            FROM jagoz.other_sport_price
            WHERE sport_id = :sportId
            """,
        )
            .bind("sportId", sportId)
            .map { rs, _ ->
                OtherSportPrice(
                    sportId = rs.getLong("sport_id"),
                    price = rs.getInt("price"),
                )
            }
            .findOne()
            .orElse(null)

    override fun upsert(price: OtherSportPrice) {
        handle.createUpdate(
            """
            INSERT INTO jagoz.other_sport_price (sport_id, price)
            VALUES (:sportId, :price)
            ON CONFLICT (sport_id) DO UPDATE SET price = EXCLUDED.price
            """,
        )
            .bind("sportId", price.sportId)
            .bind("price", price.price)
            .execute()
    }
}
