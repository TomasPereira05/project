package pt.isel.jagoz.http.model.athlete

import pt.isel.jagoz.domain.sponsor.TeamCategory

data class CategoryRequest(
    val category: TeamCategory,
)
