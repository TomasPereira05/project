package pt.isel.jagoz.repository

import pt.isel.jagoz.domain.sponsor.Sponsorship
import pt.isel.jagoz.domain.sponsor.SponsorshipStatus

interface SponsorshipRepository {
    fun findById(id: Long): Sponsorship?

    fun findBySponsorId(sponsorId: Long): List<Sponsorship>

    fun findAll(): List<Sponsorship>

    fun findPage(
        limit: Int,
        offset: Int,
    ): List<Sponsorship>

    fun countAll(): Long

    fun findPageBySponsorId(
        sponsorId: Long,
        limit: Int,
        offset: Int,
    ): List<Sponsorship>

    fun countBySponsorId(sponsorId: Long): Long

    fun save(sponsorship: Sponsorship): Long

    fun updateStatus(
        id: Long,
        status: SponsorshipStatus,
    )

    fun update(sponsorship: Sponsorship)

    fun deleteById(id: Long)

    fun existsById(id: Long): Boolean
}
