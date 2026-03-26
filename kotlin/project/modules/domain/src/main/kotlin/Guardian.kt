package pt.isel

data class Guardian(
    val guardianId: Long,
    val atheleteId: Long,
    val name: String,
    val email: String,
    val phone: String,
    val work: String,
)
