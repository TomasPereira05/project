package pt.isel.jagoz.repository

import pt.isel.jagoz.domain.sponsor.Sponsor

interface SponsorRepository {
    fun findById(id: Long): Sponsor?

    fun findByNif(nif: String): Sponsor?

    fun findAll(): List<Sponsor>

    fun save(sponsor: Sponsor): Long

    fun updateContact(
        id: Long,
        name: String,
        email: String,
        phone: String,
        nif: String
    )

    fun deleteById(id: Long)

    fun existsById(id: Long): Boolean

    fun existsByNif(nif: String): Boolean

}
