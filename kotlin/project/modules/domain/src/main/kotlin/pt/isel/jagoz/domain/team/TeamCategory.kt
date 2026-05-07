package pt.isel.jagoz.domain.team

data class TeamCategory(
    val teamId: Long,
    val teamGroupId: Long,
    val code: String,
    val label: String,
    val active: Boolean,
    val sortOrder: Int?,
)
