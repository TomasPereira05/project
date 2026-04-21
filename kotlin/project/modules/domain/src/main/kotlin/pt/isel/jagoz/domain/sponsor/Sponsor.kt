package pt.isel.jagoz.domain.sponsor

data class Sponsor(
    val sponsorId: Long,
    val name: String,
    val email: String,
    val phone: String,
    val nif: String,
)
