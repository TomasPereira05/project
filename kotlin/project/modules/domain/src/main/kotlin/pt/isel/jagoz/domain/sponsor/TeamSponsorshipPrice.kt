package pt.isel.jagoz.domain.sponsor

data class TeamSponsorshipPrice(
    val id: Long,
    val teamCategoryId: Long,
    val placementId: Long,
    val price: Int,
)
