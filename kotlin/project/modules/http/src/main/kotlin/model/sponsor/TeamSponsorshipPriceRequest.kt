package pt.isel.jagoz.http.model.sponsor

data class TeamSponsorshipPriceRequest(
    val teamCategoryId: Long,
    val placementId: Long,
    val price: Int,
)
