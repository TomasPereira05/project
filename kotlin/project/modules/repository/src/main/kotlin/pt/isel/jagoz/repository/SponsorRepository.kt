package pt.isel.jagoz.repository

import pt.isel.jagoz.domain.sponsor.Sponsor

interface SponsorRepository {
    fun findById(id: Long): Sponsor?

    fun findByNif(nif: String): Sponsor?

    fun findByEmail(email: String): List<Sponsor>

    fun findByUserId(userId: Long): List<Sponsor>

    fun findAll(): List<Sponsor>

    fun findPage(
        limit: Int,
        offset: Int,
    ): List<Sponsor>

    fun countAll(): Long

    fun findPageFiltered(
        limit: Int,
        offset: Int,
        search: String?,
    ): List<Sponsor>

    fun countFiltered(search: String?): Long

    fun save(sponsor: Sponsor): Long

    fun update(sponsor: Sponsor)

    fun updateContact(
        id: Long,
        name: String,
        email: String,
        phone: String,
        nif: String,
    )

    fun updateUserId(
        sponsorId: Long,
        userId: Long?,
    )

    fun deleteById(id: Long)

    fun existsById(id: Long): Boolean

    fun existsByNif(nif: String): Boolean
}
