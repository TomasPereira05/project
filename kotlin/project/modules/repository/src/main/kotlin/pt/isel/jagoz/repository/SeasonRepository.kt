package pt.isel.jagoz.repository

import pt.isel.jagoz.domain.season.Season

interface SeasonRepository {
    fun findAll(): List<Season>

    fun findActive(): Season?

    fun findById(seasonId: Long): Season?

    fun findByName(name: String): Season?

    fun save(season: Season): Long

    fun update(season: Season)

    fun setActive(seasonId: Long)
}
