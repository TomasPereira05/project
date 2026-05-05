package pt.isel.jagoz.repository

import pt.isel.jagoz.domain.sponsor.PubOption

interface PubOptionRepository {
    fun findAll(): List<PubOption>
    fun findActive(): List<PubOption>
    fun findById(id: Long): PubOption?

    fun save(po: PubOption): Long
    fun update(po: PubOption)
    fun deactivate(id: Long)
}