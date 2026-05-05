package pt.isel.jagoz.repository

import pt.isel.jagoz.domain.sponsor.OtherSport

interface OtherSportRepository {
    fun findAll(): List<OtherSport>
    fun findActive(): List<OtherSport>
    fun findById(id: Long): OtherSport?

    fun save(os: OtherSport): Long
    fun update(os: OtherSport)
    fun deactivate(id: Long)
}