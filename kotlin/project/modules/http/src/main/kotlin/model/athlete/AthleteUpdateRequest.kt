package pt.isel.jagoz.http.model.athlete

/**
 * Body do endpoint `PUT /api/athletes/{athleteId}`.
 *
 * Update administrativo dos campos editáveis do atleta (a categoria muda via
 * endpoint dedicado `/team-category`). Se `guardians` vier não-nulo, substitui o
 * conjunto inteiro (delete-all + insert).
 */
data class AthleteUpdateRequest(
    val jerseyNumber: Int?,
    val position: String?,
    val photoUrl: String?,
    val school: String?,
    val schoolYear: String?,
    val schoolClass: String?,
    val lastClub: String?,
    val season: String?,
    val hasFamilyInClub: Boolean,
    val guardians: List<GuardianInputDto>? = null,
)
