package pt.isel.jagoz.athlete

data class Guardian(
    val guardianId: Long,
    // Aponta para o Atleta (Menor)
    val athleteId: Long,
    // Caso o encarregado de educação seja socio
    val memberId: Long?,
    val name: String,
    val role: GuardianRole,
    // Grau de Parentesco (Pai, Mãe, etc.)
    val kinship: String,
    val email: String,
    val phone: String,
    val work: String,
    val isPrimary: Boolean = false,
    val hasFamilyInClub: Boolean,
)
