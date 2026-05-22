package pt.isel.jagoz.http.model.sponsor

data class SponsorshipDetailUpdateRequest(
    val email: String,
    val phone: String,
    val nif: String,
    val price: Int? = null,
    val otherDetails: String? = null,
)
