package pt.isel

import pt.isel.member.Member

interface MemberRepository {
    fun save(member: Member): Long

    fun update(member: Member)

    fun findById(id: Long): Member?

    fun findByEmail(email: String): Member?

    fun findAll(): List<Member>

    fun findAllActive(): List<Member>

    fun nextMemberNumber(): Int
}
