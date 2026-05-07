package pt.isel.jagoz.domain.team

data class TeamCategoryPriceOverride(
    val teamCategoryId: Long,
    val placementId: Long,
    val price: Int,
)
