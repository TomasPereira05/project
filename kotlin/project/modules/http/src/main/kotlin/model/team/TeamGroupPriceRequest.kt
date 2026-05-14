package pt.isel.jagoz.http.model.team

data class TeamGroupPriceRequest(
    val teamGroupId: Long,
    val placementId: Long,
    val price: Int,
)
