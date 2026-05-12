package pt.isel.jagoz.domain.sponsor

data class OtherSport(
    val sportId: Long,
    val code: String,
    val label: String,
    val active: Boolean,
    val price: Int,
    val sortOrder: Int?,
)
