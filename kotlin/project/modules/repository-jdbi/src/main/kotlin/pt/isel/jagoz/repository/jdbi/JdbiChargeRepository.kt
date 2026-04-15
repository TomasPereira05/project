package pt.isel.jagoz.repository.jdbi

import org.jdbi.v3.core.Handle
import pt.isel.jagoz.payment.Charge
import pt.isel.jagoz.repository.ChargeRepository
import pt.isel.jagoz.repository.jdbi.mappers.ChargeMapper

class JdbiChargeRepository(private val handle: Handle) : ChargeRepository {
    private val selectQuery =
        """
        SELECT
            c.*,
            u_c.user_id as cu_user_id, u_c.email as cu_email, u_c.username as cu_username, u_c.password_validation as cu_password_validation, u_c.role as cu_role, u_c.active_member_id as cu_active_member_id,
            u_ch.user_id as ch_user_id, u_ch.email as ch_email, u_ch.username as ch_username, u_ch.password_validation as ch_password_validation, u_ch.role as ch_role, u_ch.active_member_id as ch_active_member_id
        FROM charge c
        JOIN users u_c ON c.creation_user_id = u_c.user_id
        LEFT JOIN users u_ch ON c.charged_user_id = u_ch.user_id
        """.trimIndent()

    override fun findById(id: Long): Charge? {
        return handle.createQuery("$selectQuery WHERE c.charge_id = :id")
            .bind("id", id)
            .map { rs, _ -> ChargeMapper.map(rs) }
            .findOne()
            .orElse(null)
    }

    override fun findByMemberAndSeason(
        memberId: Long,
        season: String,
    ): List<Charge> {
        return handle.createQuery("$selectQuery WHERE c.member_id = :memberId AND c.season = :season ORDER BY c.month ASC")
            .bind("memberId", memberId)
            .bind("season", season)
            .map { rs, _ -> ChargeMapper.map(rs) }
            .list()
    }

    override fun findPendingByMember(memberId: Long): List<Charge> {
        return handle.createQuery("$selectQuery WHERE c.member_id = :memberId AND c.status = 'PENDING' ORDER BY c.created_at ASC")
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
            INSERT INTO charge (type, member_id, sponsorship_id, value, status, season, month, created_at, creation_user_id, charged_user_id, paid_at)
            VALUES (CAST(:type AS charge_type), :memberId, :sponsorshipId, :value, CAST(:status AS charge_status), :season, :month, CAST(:createdAt AS DATE), :creationUserId, :chargedUserId, CAST(:paidAt AS DATE))
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
            .bind("creationUserId", charge.creationUser.userId)
            .bind("chargedUserId", charge.chargeUser?.userId)
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
                creation_user_id = :creationUserId,
                charged_user_id = :chargedUserId,
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
            .bind("creationUserId", charge.creationUser.userId)
            .bind("chargedUserId", charge.chargeUser?.userId)
            .bind("paidAt", charge.paidAt?.toString())
            .execute()
    }
}
