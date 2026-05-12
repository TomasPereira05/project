package pt.isel.jagoz.repository

import pt.isel.jagoz.domain.team.TeamGroup

interface TeamGroupRepository {
    fun findAll(): List<TeamGroup>

    fun findById(id: Long): TeamGroup?

    fun findActive(): List<TeamGroup>

    fun save(team: TeamGroup): Long

    fun update(team: TeamGroup)

    fun deactivate(id: Long)

    fun activate(id: Long)
}
