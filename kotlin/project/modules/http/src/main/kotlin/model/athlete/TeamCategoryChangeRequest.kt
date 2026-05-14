package pt.isel.jagoz.http.model.athlete

/**
 * Body do endpoint `PUT /api/athletes/{athleteId}/team-category`.
 * Recebe apenas o id da nova categoria — o service faz lookup interno.
 */
data class TeamCategoryChangeRequest(
    val teamCategoryId: Long,
)
