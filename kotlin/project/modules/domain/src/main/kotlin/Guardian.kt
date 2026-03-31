package pt.isel

data class Guardian(
    val guardianId: Long,
    val athleteId: Long, // Aponta para o Atleta (Menor)
    val name: String,
    val kinship: String, // Grau de Parentesco (Pai, Mãe, etc.)
    val email: String,
    val phone: String,
    val work: String,
)
