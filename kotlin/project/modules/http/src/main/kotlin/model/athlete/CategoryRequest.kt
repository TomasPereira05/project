package pt.isel.jagoz.http.model.athlete

import pt.isel.jagoz.domain.team.TeamCategory

data class CategoryRequest(
    val category: TeamCategory,
)
