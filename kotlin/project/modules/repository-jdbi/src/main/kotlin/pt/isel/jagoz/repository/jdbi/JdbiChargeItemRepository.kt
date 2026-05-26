package pt.isel.jagoz.repository.jdbi

import org.jdbi.v3.core.Handle
import pt.isel.jagoz.domain.payment.ChargeItem
import pt.isel.jagoz.domain.payment.ChargeItemWithStatus
import pt.isel.jagoz.domain.payment.ChargeStatus
import pt.isel.jagoz.repository.ChargeItemRepository

class JdbiChargeItemRepository(
    private val handle: Handle,
) : ChargeItemRepository {
    override fun findByChargeId(chargeId: Long): List<ChargeItem> =
        handle
            .createQuery("SELECT * FROM jagoz.charge_item WHERE charge_id = :chargeId ORDER BY season ASC, month ASC")
            .bind("chargeId", chargeId)
            .mapTo(ChargeItem::class.java)
            .list()

    override fun findByMember(memberId: Long): List<ChargeItem> =
        handle
            .createQuery(
                """
                SELECT ci.*
                FROM jagoz.charge_item ci
                JOIN jagoz.charge c ON c.charge_id = ci.charge_id
                WHERE c.member_id = :memberId
                ORDER BY ci.season ASC, ci.month ASC
                """,
            ).bind("memberId", memberId)
            .mapTo(ChargeItem::class.java)
            .list()

    override fun findWithStatusByMember(memberId: Long): List<ChargeItemWithStatus> =
        handle
            .createQuery(
                """
                SELECT ci.*, c.status AS charge_status, paid_payment.payment_id
                FROM jagoz.charge_item ci
                JOIN jagoz.charge c ON c.charge_id = ci.charge_id
                LEFT JOIN LATERAL (
                    SELECT p.payment_id
                    FROM jagoz.payment p
                    WHERE p.charge_id = c.charge_id
                      AND p.status = 'PAID'
                    ORDER BY p.confirmed_at DESC NULLS LAST, p.payment_id DESC
                    LIMIT 1
                ) paid_payment ON TRUE
                WHERE c.member_id = :memberId
                ORDER BY ci.season ASC, ci.month ASC
                """,
            ).bind("memberId", memberId)
            .map { rs, _ ->
                ChargeItemWithStatus(
                    item =
                        ChargeItem(
                            chargeItemId = rs.getLong("charge_item_id"),
                            chargeId = rs.getLong("charge_id"),
                            season = rs.getString("season"),
                            month = rs.getInt("month"),
                            amount = rs.getInt("amount"),
                            description = rs.getString("description"),
                        ),
                    chargeStatus = ChargeStatus.valueOf(rs.getString("charge_status")),
                    paymentId = (rs.getObject("payment_id") as? Number)?.toLong(),
                )
            }.list()

    override fun existsPaidOrPending(
        memberId: Long,
        season: String,
        month: Int,
    ): Boolean =
        handle
            .createQuery(
                """
                SELECT COUNT(*)
                FROM jagoz.charge_item ci
                JOIN jagoz.charge c ON c.charge_id = ci.charge_id
                WHERE c.member_id = :memberId
                  AND ci.season = :season
                  AND ci.month = :month
                  AND c.status IN ('PENDING', 'PAID')
                """,
            ).bind("memberId", memberId)
            .bind("season", season)
            .bind("month", month)
            .mapTo(Int::class.java)
            .one() > 0

    override fun save(item: ChargeItem): Long =
        handle
            .createUpdate(
                """
                INSERT INTO jagoz.charge_item (charge_id, season, month, amount, description)
                VALUES (:chargeId, :season, :month, :amount, :description)
                """,
            ).bind("chargeId", item.chargeId)
            .bind("season", item.season)
            .bind("month", item.month)
            .bind("amount", item.amount)
            .bind("description", item.description)
            .executeAndReturnGeneratedKeys()
            .mapTo(Long::class.java)
            .one()
}
