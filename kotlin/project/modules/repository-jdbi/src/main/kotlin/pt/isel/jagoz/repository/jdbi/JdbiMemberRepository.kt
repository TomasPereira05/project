package pt.isel.jagoz.repository.jdbi

import org.jdbi.v3.core.Handle
import pt.isel.jagoz.domain.member.Member
import pt.isel.jagoz.repository.MemberRepository

class JdbiMemberRepository(private val handle: Handle) : MemberRepository {
    override fun findById(id: Long): Member? {
        return handle.createQuery("SELECT * FROM jagoz.member WHERE member_id = :id")
            .bind("id", id)
            .mapTo(Member::class.java)
            .findOne()
            .orElse(null)
    }

    override fun findByEmail(email: String): Member? {
        return handle.createQuery("SELECT * FROM jagoz.member WHERE email = :email")
            .bind("email", email)
            .mapTo(Member::class.java)
            .findOne()
            .orElse(null)
    }

    override fun findAll(): List<Member> {
        return handle.createQuery("SELECT * FROM jagoz.member ORDER BY member_number ASC")
            .mapTo(Member::class.java)
            .list()
    }

    override fun findAllActive(): List<Member> {
        return handle.createQuery("SELECT * FROM jagoz.member WHERE status = 'ATIVO' ORDER BY member_number ASC")
            .mapTo(Member::class.java)
            .list()
    }

    override fun nextMemberNumber(): Int {
        val maxNumber =
            handle.createQuery("SELECT MAX(member_number) FROM jagoz.member WHERE member_number IS NOT NULL")
                .mapTo(Int::class.javaObjectType)
                .findOne()
                .orElse(0)
        return (maxNumber ?: 0) + 1
    }

    override fun save(member: Member): Long {
        return handle.createUpdate(
            """
            INSERT INTO jagoz.member (
                member_number, complete_name, birth_date, email, phone, home_phone, 
                address, postal_code, city, category, status, former_member, 
                membership_quota, billing_location, registration_date, approval_date, 
                privacy_accepted, coms_accepted
            ) VALUES (
                :memberNumber, :completeName, CAST(:birthDate AS DATE), :email, :phone, :homePhone, 
                :address, :postalCode, :city, CAST(:category AS jagoz.member_category), 
                CAST(:status AS jagoz.member_status), :formerMember, :membershipQuota, 
                :billingLocation, CAST(:registrationDate AS DATE), CAST(:approvalDate AS DATE), 
                :privacyAccepted, :comsAccepted
            )
            """,
        )
            .bind("memberNumber", if (member.memberNumber > 0) member.memberNumber else null)
            .bind("completeName", member.completeName)
            .bind("birthDate", member.birthDate.toString())
            .bind("email", member.email)
            .bind("phone", member.phone)
            .bind("homePhone", member.homePhone)
            .bind("address", member.address)
            .bind("postalCode", member.postalCode)
            .bind("city", member.city)
            .bind("category", member.category.name)
            .bind("status", member.status.name)
            .bind("formerMember", member.formerMember)
            .bind("membershipQuota", member.membershipQuota)
            .bind("billingLocation", member.billingLocation)
            .bind("registrationDate", member.registrationDate.toString())
            .bind("approvalDate", member.approvalDate?.toString())
            .bind("privacyAccepted", member.privacyAccepted)
            .bind("comsAccepted", member.comsAccepted)
            .executeAndReturnGeneratedKeys()
            .mapTo(Long::class.java)
            .one()
    }

    override fun update(member: Member) {
        handle.createUpdate(
            """
            UPDATE jagoz.member SET 
                member_number = :memberNumber,
                complete_name = :completeName,
                birth_date = CAST(:birthDate AS DATE),
                email = :email,
                phone = :phone,
                home_phone = :homePhone,
                address = :address,
                postal_code = :postalCode,
                city = :city,
                category = CAST(:category AS jagoz.member_category),
                status = CAST(:status AS jagoz.member_status),
                former_member = :formerMember,
                membership_quota = :membershipQuota,
                billing_location = :billingLocation,
                registration_date = CAST(:registrationDate AS DATE),
                approval_date = CAST(:approvalDate AS DATE),
                privacy_accepted = :privacyAccepted,
                coms_accepted = :comsAccepted
            WHERE member_id = :id
            """,
        )
            .bind("id", member.memberId)
            .bind("memberNumber", if (member.memberNumber > 0) member.memberNumber else null)
            .bind("completeName", member.completeName)
            .bind("birthDate", member.birthDate.toString())
            .bind("email", member.email)
            .bind("phone", member.phone)
            .bind("homePhone", member.homePhone)
            .bind("address", member.address)
            .bind("postalCode", member.postalCode)
            .bind("city", member.city)
            .bind("category", member.category.name)
            .bind("status", member.status.name)
            .bind("formerMember", member.formerMember)
            .bind("membershipQuota", member.membershipQuota)
            .bind("billingLocation", member.billingLocation)
            .bind("registrationDate", member.registrationDate.toString())
            .bind("approvalDate", member.approvalDate?.toString())
            .bind("privacyAccepted", member.privacyAccepted)
            .bind("comsAccepted", member.comsAccepted)
            .execute()
    }
}
