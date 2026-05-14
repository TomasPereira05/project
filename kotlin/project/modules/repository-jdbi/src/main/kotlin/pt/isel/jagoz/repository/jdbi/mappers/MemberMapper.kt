package pt.isel.jagoz.repository.jdbi.mappers

import kotlinx.datetime.LocalDate
import org.jdbi.v3.core.mapper.RowMapper
import org.jdbi.v3.core.statement.StatementContext
import pt.isel.jagoz.domain.member.Member
import pt.isel.jagoz.domain.member.MemberCategory
import pt.isel.jagoz.domain.member.MemberStatus
import java.sql.ResultSet

class MemberMapper : RowMapper<Member> {
    override fun map(
        rs: ResultSet,
        ctx: StatementContext,
    ): Member {
        val memberNumber = (rs.getObject("member_number") as? Number)?.toInt() ?: 0

        return Member(
            memberId = rs.getLong("member_id"),
            userId = rs.getLong("user_id"),
            memberNumber = memberNumber,
            completeName = rs.getString("complete_name"),
            birthDate = LocalDate.parse(rs.getString("birth_date")),
            birthplace = rs.getString("birthplace"),
            email = rs.getString("email"),
            phone = rs.getString("phone"),
            homePhone = rs.getString("home_phone"),
            address = rs.getString("address"),
            postalCode = rs.getString("postal_code"),
            city = rs.getString("city"),
            nif = rs.getString("nif"),
            category = MemberCategory.valueOf(rs.getString("category")),
            formerMember = rs.getBoolean("former_member"),
            status = MemberStatus.valueOf(rs.getString("status")),
            membershipQuota = rs.getInt("membership_quota"),
            billingLocation = rs.getString("billing_location"),
            registrationDate = LocalDate.parse(rs.getString("registration_date")),
            approvalDate = rs.getString("approval_date")?.let(LocalDate::parse),
            privacyAccepted = rs.getBoolean("privacy_accepted"),
            comsAccepted = rs.getBoolean("coms_accepted"),
        )
    }
}
