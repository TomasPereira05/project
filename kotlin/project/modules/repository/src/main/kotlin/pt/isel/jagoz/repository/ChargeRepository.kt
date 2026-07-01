package pt.isel.jagoz.repository

import pt.isel.jagoz.domain.payment.Charge

interface ChargeRepository {
    fun findById(id: Long): Charge?

    fun findByMemberAndSeason(
        memberId: Long,
        season: String,
    ): List<Charge>

    fun findPendingByMember(memberId: Long): List<Charge>

    fun findPendingBySponsorship(sponsorshipId: Long): Charge?

    fun countPending(): Long

    fun existsByMemberSeasonMonth(
        memberId: Long,
        season: String,
        month: Int,
    ): Boolean

    fun save(charge: Charge): Long

    fun update(charge: Charge)
}
