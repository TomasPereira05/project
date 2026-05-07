package pt.isel.jagoz.repository

import pt.isel.jagoz.domain.team.TeamGroupPrice

interface TeamGroupPriceRepository {
    fun find(
        groupId: Long,
        placementId: Long,
    ): TeamGroupPrice?

    fun findAll(): List<TeamGroupPrice>

    fun save(
        groupId: Long,
        placementId: Long,
        price: Int,
    )

    fun update(
        groupId: Long,
        placementId: Long,
        price: Int,
    )
}
