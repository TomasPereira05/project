package pt.isel.jagoz.repository.jdbi

import org.jdbi.v3.core.Handle
import pt.isel.jagoz.domain.sponsor.PubOptionPrice
import pt.isel.jagoz.repository.PubOptionPriceRepository

class JdbiPubOptionPriceRepository(
    private val handle: Handle,
) : PubOptionPriceRepository {
    override fun findAll(): List<PubOptionPrice> =
        handle.createQuery(
            """
            SELECT pub_option_id, price
            FROM jagoz.pub_option_price
            ORDER BY pub_option_id
            """,
        )
            .map { rs, _ ->
                PubOptionPrice(
                    pubOptionId = rs.getLong("pub_option_id"),
                    price = rs.getInt("price"),
                )
            }
            .list()

    override fun findByPubOptionId(pubOptionId: Long): PubOptionPrice? =
        handle.createQuery(
            """
            SELECT pub_option_id, price
            FROM jagoz.pub_option_price
            WHERE pub_option_id = :pubOptionId
            """,
        )
            .bind("pubOptionId", pubOptionId)
            .map { rs, _ ->
                PubOptionPrice(
                    pubOptionId = rs.getLong("pub_option_id"),
                    price = rs.getInt("price"),
                )
            }
            .findOne()
            .orElse(null)

    override fun upsert(price: PubOptionPrice) {
        handle.createUpdate(
            """
            INSERT INTO jagoz.pub_option_price (pub_option_id, price)
            VALUES (:pubOptionId, :price)
            ON CONFLICT (pub_option_id) DO UPDATE SET price = EXCLUDED.price
            """,
        )
            .bind("pubOptionId", price.pubOptionId)
            .bind("price", price.price)
            .execute()
    }
}
