package pt.isel.jagoz.http.model.payment

data class CreateCheckoutSessionInput(
    val chargeId: Long? = null,
    val sponsorshipId: Long? = null,
)
