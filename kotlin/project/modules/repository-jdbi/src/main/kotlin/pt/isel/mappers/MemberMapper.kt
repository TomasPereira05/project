package pt.isel.mappers

import kotlinx.datetime.LocalDate
import pt.isel.member.Member
import pt.isel.member.MemberCategory
import pt.isel.member.MemberStatus
import java.sql.ResultSet

object MemberMapper {
    fun map(rs: ResultSet): Member {
        val memberNumber = (rs.getObject("member_number") as? Number)?.toInt() ?: 0

        return Member(
            memberId = rs.getLong("member_id"),
            memberNumber = memberNumber,
            completeName = rs.getString("complete_name"),
            birthDate = LocalDate.parse(rs.getString("birth_date")),
            email = rs.getString("email"),
            phone = rs.getString("phone"),
            homePhone = rs.getString("home_phone"),
            address = rs.getString("address"),
            postalCode = rs.getString("postal_code"),
            city = rs.getString("city"),
            category = MemberCategory.valueOf(rs.getString("category")),
            formerMember = rs.getBoolean("former_member"),
            status = MemberStatus.valueOf(rs.getString("status")),
            monthlyQuota = rs.getDouble("monthly_quota"),
            billingLocation = rs.getString("billing_location"),
            registrationDate = LocalDate.parse(rs.getString("registration_date")),
            approvalDate = rs.getString("approval_date")?.let(LocalDate::parse),
            privacyAccepted = rs.getBoolean("privacy_accepted"),
            comsAccepted = rs.getBoolean("coms_accepted"),
        )
    }
}
