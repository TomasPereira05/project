package pt.isel.sponsor

data class Sponsor(
    val sponsorId: Long,
    val name: String,
    val email: String,
    val phone: String,
    val nif: String,
)