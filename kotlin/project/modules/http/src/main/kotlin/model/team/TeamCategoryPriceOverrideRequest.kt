package pt.isel.jagoz.http.model.team

data class TeamCategoryPriceOverrideRequest(
    val teamCategoryId: Long,
    val placementId: Long,
    val price: Int,
)