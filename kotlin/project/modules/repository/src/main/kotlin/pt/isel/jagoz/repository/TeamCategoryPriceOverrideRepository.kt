package pt.isel.jagoz.repository

import pt.isel.jagoz.domain.team.TeamCategoryPriceOverride

interface TeamCategoryPriceOverrideRepository {
    fun find(
        categoryId: Long,
        placementId: Long,
    ): TeamCategoryPriceOverride?

    fun findAll(): List<TeamCategoryPriceOverride>

    fun save(
        categoryId: Long,
        placementId: Long,
        price: Int,
    )

    fun update(
        categoryId: Long,
        placementId: Long,
        price: Int,
    )

    fun delete(
        categoryId: Long,
        placementId: Long,
    )
}
