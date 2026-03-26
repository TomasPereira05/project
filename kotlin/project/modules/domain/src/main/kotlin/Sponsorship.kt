package pt.isel

data class Sponsorship(
    val sponsorshipId: Long,
    val sponsorId: Long,
    val season: String,
    val status: SponsorshipStatus,
    val packages: List<SponsorshipPackage>,
)
