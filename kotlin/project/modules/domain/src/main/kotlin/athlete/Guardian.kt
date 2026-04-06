package athlete

data class Guardian(
    val guardianId: Long,
    val athleteId: Long, // Aponta para o Atleta (Menor)
    val memberId: Long?, //Caso o encarregado de educação seja socio
    val name: String,
    val kinship: String, // Grau de Parentesco (Pai, Mãe, etc.)
    val email: String,
    val phone: String,
    val work: String,
    val hasFamilyInClub: Boolean,
)