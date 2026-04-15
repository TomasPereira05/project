package pt.isel.jagoz.repository.jdbi.mappers

import kotlinx.datetime.LocalDate
import pt.isel.jagoz.payment.Charge
import pt.isel.jagoz.payment.ChargeStatus
import pt.isel.jagoz.payment.ChargeType
import java.sql.ResultSet

object ChargeMapper {
    fun map(rs: ResultSet): Charge {
        val memberId = (rs.getObject("member_id") as? Number)?.toLong()
        val sponsorshipId = (rs.getObject("sponsorship_id") as? Number)?.toLong()
        val month = (rs.getObject("month") as? Number)?.toInt()

        val chargeUserRecord =
            rs.getObject("ch_user_id")?.let {
                pt.isel.user.User(
                    userId = rs.getLong("ch_user_id"),
                    email = rs.getString("ch_email"),
                    username = rs.getString("ch_username"),
                    passwordValidation = pt.isel.user.PasswordValidationInfo(rs.getString("ch_password_validation")),
                    role = pt.isel.user.Role.valueOf(rs.getString("ch_role")),
                    activeMemberId = (rs.getObject("ch_active_member_id") as? Number)?.toLong(),
                )
            }

        val creationUserRecord =
            pt.isel.user.User(
                userId = rs.getLong("cu_user_id"),
                email = rs.getString("cu_email"),
                username = rs.getString("cu_username"),
                passwordValidation = pt.isel.user.PasswordValidationInfo(rs.getString("cu_password_validation")),
                role = pt.isel.user.Role.valueOf(rs.getString("cu_role")),
                activeMemberId = (rs.getObject("cu_active_member_id") as? Number)?.toLong(),
            )

        return Charge(
            chargeId = rs.getLong("charge_id"),
            type = ChargeType.valueOf(rs.getString("type")),
            memberId = memberId,
            sponsorshipId = sponsorshipId,
            value = rs.getDouble("value"),
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
