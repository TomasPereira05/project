package pt.isel

import pt.isel.sponsor.Sponsorship

interface SponsorshipRepository {
    fun findById(id: Long): Sponsorship?

    fun findBySponsorId(sponsorId: Long): List<Sponsorship>

    fun save(sponsorship: Sponsorship): Long

    fun update(sponsorship: Sponsorship)
}
