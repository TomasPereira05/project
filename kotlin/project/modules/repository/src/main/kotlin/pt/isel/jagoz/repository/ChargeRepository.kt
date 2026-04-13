package pt.isel.jagoz.repository.pt.isel.jagoz.repository

import pt.isel.jagoz.payment.Charge

interface ChargeRepository {
    fun findById(id: Long): Charge?

    fun findByMemberAndSeason(
        memberId: Long,
        season: String,
    ): List<Charge>

    fun findPendingByMember(memberId: Long): List<Charge>

    fun existsByMemberSeasonMonth(
        memberId: Long,
        season: String,
        month: Int,
    ): Boolean

    fun save(charge: Charge): Long

    fun update(charge: Charge)
}
