package pt.isel.jagoz.repository

import pt.isel.jagoz.sponsor.Sponsor

interface SponsorRepository {
    fun findById(id: Long): Sponsor?

    fun findByNif(nif: String): Sponsor?

    fun findAll(): List<Sponsor>

    fun save(sponsor: Sponsor): Long

    fun update(sponsor: Sponsor)
}
