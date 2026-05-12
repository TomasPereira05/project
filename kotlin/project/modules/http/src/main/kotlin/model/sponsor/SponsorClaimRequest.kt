package pt.isel.jagoz.http.model.sponsor

data class SponsorClaimRequest(
    val nif: String,
    val email: String,
    val phone: String,
)
