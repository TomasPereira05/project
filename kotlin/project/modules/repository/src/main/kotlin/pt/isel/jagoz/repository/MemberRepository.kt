package pt.isel.jagoz.repository

import pt.isel.jagoz.domain.member.Member
import pt.isel.jagoz.domain.member.MemberCategory
import pt.isel.jagoz.domain.member.MemberStatus

interface MemberRepository {
    fun save(member: Member): Long

    fun update(member: Member)

    fun findById(id: Long): Member?

    fun findByIds(ids: List<Long>): List<Member>

    fun findByEmail(email: String): Member?

    fun findByMemberNumber(memberNumber: Int): Member?

    fun findAll(): List<Member>

    fun findPage(
        limit: Int,
        offset: Int,
    ): List<Member>

    fun countAll(): Long

    fun countByStatus(status: MemberStatus): Long

    fun findPageFiltered(
        limit: Int,
        offset: Int,
        search: String?,
        category: MemberCategory?,
        status: MemberStatus?,
    ): List<Member>

    fun countFiltered(
        search: String?,
        category: MemberCategory?,
        status: MemberStatus?,
    ): Long

    fun findAllActive(): List<Member>

    fun nextMemberNumber(): Int
}
