package pt.isel.jagoz.repository.jdbi.mappers

import kotlinx.datetime.LocalDate
import org.jdbi.v3.core.mapper.RowMapper
import org.jdbi.v3.core.statement.StatementContext
import pt.isel.jagoz.domain.payment.Charge
import pt.isel.jagoz.domain.payment.ChargeStatus
import pt.isel.jagoz.domain.payment.ChargeType
import pt.isel.jagoz.domain.user.PasswordValidationInfo
import pt.isel.jagoz.domain.user.Role
import pt.isel.jagoz.domain.user.User
import java.sql.ResultSet

class ChargeMapper : RowMapper<Charge> {
    override fun map(
        rs: ResultSet,
        ctx: StatementContext,
    ): Charge {
        val memberId = (rs.getObject("member_id") as? Number)?.toLong()
        val sponsorshipId = (rs.getObject("sponsorship_id") as? Number)?.toLong()
        val month = (rs.getObject("month") as? Number)?.toInt()

        val chargeUserRecord =
            rs.getObject("ch_user_id")?.let {
                User(
                    userId = rs.getLong("ch_user_id"),
                    email = rs.getString("ch_email"),
                    username = rs.getString("ch_username"),
                    passwordValidation = PasswordValidationInfo(rs.getString("ch_password_validation")),
                    role = Role.valueOf(rs.getString("ch_role")),
                    activeMemberId = (rs.getObject("ch_active_member_id") as? Number)?.toLong(),
                )
            }

        val creationUserRecord =
            User(
                userId = rs.getLong("cu_user_id"),
                email = rs.getString("cu_email"),
                username = rs.getString("cu_username"),
                passwordValidation = PasswordValidationInfo(rs.getString("cu_password_validation")),
                role = Role.valueOf(rs.getString("cu_role")),
                activeMemberId = (rs.getObject("cu_active_member_id") as? Number)?.toLong(),
            )

        return Charge(
            chargeId = rs.getLong("charge_id"),
            type = ChargeType.valueOf(rs.getString("type")),
            memberId = memberId,
            sponsorshipId = sponsorshipId,
            value = rs.getInt("value"),
            status = ChargeStatus.valueOf(rs.getString("status")),
            season = rs.getString("season"),
            month = month,
            createdAt = LocalDate.parse(rs.getString("created_at")),
            creationUser = creationUserRecord,
            chargeUser = chargeUserRecord,
            paidAt = rs.getString("paid_at")?.let(LocalDate::parse),
        )
    }
}
