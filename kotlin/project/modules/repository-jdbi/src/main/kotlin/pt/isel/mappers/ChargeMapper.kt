package pt.isel.mappers

import kotlinx.datetime.LocalDate
import pt.isel.payment.Charge
import pt.isel.payment.ChargeStatus
import pt.isel.payment.ChargeType
import java.sql.ResultSet

object ChargeMapper {
    fun map(rs: ResultSet): Charge {
        val memberId = (rs.getObject("member_id") as? Number)?.toLong()
        val sponsorshipId = (rs.getObject("sponsorship_id") as? Number)?.toLong()
        val month = (rs.getObject("month") as? Number)?.toInt()

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
            paidAt = rs.getString("paid_at")?.let(LocalDate::parse),
        )
    }
}
