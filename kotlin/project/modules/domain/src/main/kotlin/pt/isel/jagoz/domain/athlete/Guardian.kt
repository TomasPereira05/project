package pt.isel.jagoz.domain.athlete

data class Guardian(
    val guardianId: Long,
    // Aponta para o Atleta (Menor)
    val athleteId: Long,
    // Caso o encarregado de educaÃ§Ã£o seja socio
    val memberId: Long?,
    val name: String,
    val role: GuardianRole,
    // Grau de Parentesco (Pai, MÃ£e, etc.)
    val kinship: String,
    val email: String,
    val phone: String,
    val work: String,
    val isPrimary: Boolean = false,
    val hasFamilyInClub: Boolean,
)
