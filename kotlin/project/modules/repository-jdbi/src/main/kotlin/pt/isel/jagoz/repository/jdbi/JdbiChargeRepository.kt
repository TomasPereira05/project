package pt.isel.jagoz.repository.jdbi

import org.jdbi.v3.core.Handle
import pt.isel.jagoz.payment.Charge
import pt.isel.jagoz.repository.jdbi.mappers.ChargeMapper
import pt.isel.jagoz.repository.ChargeRepository

class JdbiChargeRepository(private val handle: Handle) : ChargeRepository {
    override fun findById(id: Long): Charge? {
        return handle.createQuery("SELECT * FROM charge WHERE charge_id = :id")
            .bind("id", id)
            .map { rs, _ -> ChargeMapper.map(rs) }
            .findOne()
            .orElse(null)
    }

    override fun findByMemberAndSeason(
        memberId: Long,
        season: String,
    ): List<Charge> {
        return handle.createQuery("SELECT * FROM charge WHERE member_id = :memberId AND season = :season ORDER BY month ASC")
            .bind("memberId", memberId)
            .bind("season", season)
            .map { rs, _ -> ChargeMapper.map(rs) }
            .list()
    }

    override fun findPendingByMember(memberId: Long): List<Charge> {
        return handle.createQuery("SELECT * FROM charge WHERE member_id = :memberId AND status = 'PENDING' ORDER BY created_at ASC")
            .bind("memberId", memberId)
            .map { rs, _ -> ChargeMapper.map(rs) }
            .list()
    }

    override fun existsByMemberSeasonMonth(
        memberId: Long,
        season: String,
        month: Int,
    ): Boolean {
        return handle.createQuery("SELECT COUNT(*) FROM charge WHERE member_id = :memberId AND season = :season AND month = :month")
            .bind("memberId", memberId)
            .bind("season", season)
            .bind("month", month)
            .mapTo(Int::class.java)
            .one() > 0
    }

    override fun save(charge: Charge): Long {
        return handle.createUpdate(
            """
            INSERT INTO charge (type, member_id, sponsorship_id, value, status, season, month, created_at, paid_at)
            VALUES (CAST(:type AS charge_type), :memberId, :sponsorshipId, :value, CAST(:status AS charge_status), :season, :month, CAST(:createdAt AS DATE), CAST(:paidAt AS DATE))
            """,
        )
            .bind("type", charge.type.name)
            .bind("memberId", charge.memberId)
            .bind("sponsorshipId", charge.sponsorshipId)
            .bind("value", charge.value)
            .bind("status", charge.status.name)
            .bind("season", charge.season)
            .bind("month", charge.month)
            .bind("createdAt", charge.createdAt.toString())
            .bind("paidAt", charge.paidAt?.toString())
            .executeAndReturnGeneratedKeys()
            .mapTo(Long::class.java)
            .one()
    }

    override fun update(charge: Charge) {
        handle.createUpdate(
            """
            UPDATE charge SET 
                type = CAST(:type AS charge_type),
                member_id = :memberId,
                sponsorship_id = :sponsorshipId,
                value = :value,
                status = CAST(:status AS charge_status),
                season = :season,
                month = :month,
                created_at = CAST(:createdAt AS DATE),
                paid_at = CAST(:paidAt AS DATE)
            WHERE charge_id = :id
            """,
        )
            .bind("id", charge.chargeId)
            .bind("type", charge.type.name)
            .bind("memberId", charge.memberId)
            .bind("sponsorshipId", charge.sponsorshipId)
            .bind("value", charge.value)
            .bind("status", charge.status.name)
            .bind("season", charge.season)
            .bind("month", charge.month)
            .bind("createdAt", charge.createdAt.toString())
            .bind("paidAt", charge.paidAt?.toString())
            .execute()
    }
}
