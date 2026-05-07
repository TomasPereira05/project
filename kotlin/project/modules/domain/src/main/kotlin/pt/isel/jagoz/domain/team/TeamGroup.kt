package pt.isel.jagoz.domain.team

data class TeamGroup(
    val teamGroupId: Long,
    val code: String,
    val label: String,
    val active: Boolean,
    val sortOrder: Int,
)
