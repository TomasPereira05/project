package pt.isel.jagoz.domain.sponsor

data class TeamCategory(
    val teamId: Long,
    val code: String,
    val label: String,
    val active: Boolean,
    val sortOrder: Int?
)

