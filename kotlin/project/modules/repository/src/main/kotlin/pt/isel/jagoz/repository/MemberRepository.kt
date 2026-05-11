package pt.isel.jagoz.repository

import pt.isel.jagoz.domain.member.Member

interface MemberRepository {
    fun save(member: Member): Long

    fun update(member: Member)

    fun findById(id: Long): Member?

    fun findByEmail(email: String): Member?

    fun findAll(): List<Member>

    fun findPage(
        limit: Int,
        offset: Int,
    ): List<Member>

    fun countAll(): Long

    fun findAllActive(): List<Member>

    fun nextMemberNumber(): Int
}
