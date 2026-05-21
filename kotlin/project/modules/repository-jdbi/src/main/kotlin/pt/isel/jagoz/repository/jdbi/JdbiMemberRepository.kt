package pt.isel.jagoz.repository.jdbi

import org.jdbi.v3.core.Handle
import pt.isel.jagoz.domain.member.Member
import pt.isel.jagoz.repository.MemberRepository

class JdbiMemberRepository(
    private val handle: Handle,
) : MemberRepository {
    override fun findById(id: Long): Member? =
        handle
            .createQuery("SELECT * FROM jagoz.member WHERE member_id = :id")
            .bind("id", id)
            .mapTo(Member::class.java)
            .findOne()
            .orElse(null)

    override fun findByIds(ids: List<Long>): List<Member> {
        if (ids.isEmpty()) return emptyList()
        return handle
            .createQuery("SELECT * FROM jagoz.member WHERE member_id IN (<ids>)")
            .bindList("ids", ids)
            .mapTo(Member::class.java)
            .list()
    }

    override fun findByEmail(email: String): Member? =
        handle
            .createQuery("SELECT * FROM jagoz.member WHERE email = :email")
            .bind("email", email)
            .mapTo(Member::class.java)
            .findOne()
            .orElse(null)

    override fun findByMemberNumber(memberNumber: Int): Member? =
        handle
            .createQuery("SELECT * FROM jagoz.member WHERE member_number = :memberNumber")
            .bind("memberNumber", memberNumber)
            .mapTo(Member::class.java)
            .findOne()
            .orElse(null)

    override fun findAll(): List<Member> =
        handle
            .createQuery("SELECT * FROM jagoz.member ORDER BY member_number ASC")
            .mapTo(Member::class.java)
            .list()

    /**
     * Pendentes primeiro (para ficarem todos na página 1), depois os mais recentes.
     */
    override fun findPage(
        limit: Int,
        offset: Int,
    ): List<Member> =
        handle
            .createQuery(
                """
                SELECT * FROM jagoz.member
                ORDER BY (status = 'PENDENTE') DESC, registration_date DESC, member_id DESC
                LIMIT :limit OFFSET :offset
                """.trimIndent(),
            ).bind("limit", limit)
            .bind("offset", offset)
            .mapTo(Member::class.java)
            .list()

    override fun countAll(): Long =
        handle
            .createQuery("SELECT COUNT(*) FROM jagoz.member")
            .mapTo(Long::class.java)
            .one()

    override fun findAllActive(): List<Member> =
        handle
            .createQuery("SELECT * FROM jagoz.member WHERE status = 'ATIVO' ORDER BY member_number ASC")
            .mapTo(Member::class.java)
            .list()

    override fun nextMemberNumber(): Int {
        val maxNumber =
            handle
                .createQuery("SELECT MAX(member_number) FROM jagoz.member WHERE member_number IS NOT NULL")
                .mapTo(Int::class.javaObjectType)
                .findOne()
                .orElse(0)
        return (maxNumber ?: 0) + 1
    }

    override fun save(member: Member): Long =
        handle
            .createUpdate(
                """
            INSERT INTO jagoz.member (
                user_id, member_number, complete_name, birth_date, birthplace, email, phone, home_phone,
                address, postal_code, city, nif, category, status, former_member,
                membership_quota, billing_location, registration_date, approval_date,
                privacy_accepted, coms_accepted
            ) VALUES (
                :userId, :memberNumber, :completeName, :birthDate, :birthplace, :email, :phone, :homePhone,
                :address, :postalCode, :city,:nif, CAST(:category AS jagoz.member_category),
                CAST(:status AS jagoz.member_status), :formerMember, :membershipQuota,
                :billingLocation, :registrationDate, :approvalDate,
                :privacyAccepted, :comsAccepted
            )
            """,
            ).bind("userId", member.userId)
            .bind("memberNumber", if (member.memberNumber > 0) member.memberNumber else null)
            .bind("completeName", member.completeName)
            .bind("birthDate", member.birthDate)
            .bind("birthplace", member.birthplace)
            .bind("email", member.email)
            .bind("phone", member.phone)
            .bind("homePhone", member.homePhone)
            .bind("address", member.address)
            .bind("postalCode", member.postalCode)
            .bind("city", member.city)
            .bind("nif", member.nif)
            .bind("category", member.category.name)
            .bind("status", member.status.name)
            .bind("formerMember", member.formerMember)
            .bind("membershipQuota", member.membershipQuota)
            .bind("billingLocation", member.billingLocation)
            .bind("registrationDate", member.registrationDate)
            .bind("approvalDate", member.approvalDate)
            .bind("privacyAccepted", member.privacyAccepted)
            .bind("comsAccepted", member.comsAccepted)
            .executeAndReturnGeneratedKeys()
            .mapTo(Long::class.java)
            .one()

    override fun update(member: Member) {
        handle
            .createUpdate(
                """
            UPDATE jagoz.member SET
                member_number = :memberNumber,
                complete_name = :completeName,
                birth_date = :birthDate,
                birthplace = :birthplace,
                email = :email,
                phone = :phone,
                home_phone = :homePhone,
                address = :address,
                postal_code = :postalCode,
                city = :city,
                nif = :nif,
                category = CAST(:category AS jagoz.member_category),
                status = CAST(:status AS jagoz.member_status),
                former_member = :formerMember,
                membership_quota = :membershipQuota,
                billing_location = :billingLocation,
                registration_date = :registrationDate,
                approval_date = :approvalDate,
                privacy_accepted = :privacyAccepted,
                coms_accepted = :comsAccepted
            WHERE member_id = :id
            """,
            ).bind("id", member.memberId)
            .bind("memberNumber", if (member.memberNumber > 0) member.memberNumber else null)
            .bind("completeName", member.completeName)
            .bind("birthDate", member.birthDate)
            .bind("birthplace", member.birthplace)
            .bind("email", member.email)
            .bind("phone", member.phone)
            .bind("homePhone", member.homePhone)
            .bind("address", member.address)
            .bind("postalCode", member.postalCode)
            .bind("city", member.city)
            .bind("nif", member.nif)
            .bind("category", member.category.name)
            .bind("status", member.status.name)
            .bind("formerMember", member.formerMember)
            .bind("membershipQuota", member.membershipQuota)
            .bind("billingLocation", member.billingLocation)
            .bind("registrationDate", member.registrationDate)
            .bind("approvalDate", member.approvalDate)
            .bind("privacyAccepted", member.privacyAccepted)
            .bind("comsAccepted", member.comsAccepted)
            .execute()
    }
}
