package pt.isel

data class SponsorshipPackage (
    val sponsorshipPackageId: Long,
    val name: String,
    val description: String,
    val price: Double,
    val type: SponsorType
)