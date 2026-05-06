package pt.isel.jagoz.repository

import pt.isel.jagoz.domain.sponsor.TeamCategory

interface TeamCategoryRepository {
    fun findAll(): List<TeamCategory>

    fun findById(id: Long): TeamCategory?

    fun findActive(): List<TeamCategory>

    fun save(team: TeamCategory): Long

    fun update(team: TeamCategory)

    fun deactivate(id: Long)
}