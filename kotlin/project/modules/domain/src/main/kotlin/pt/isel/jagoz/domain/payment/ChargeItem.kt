package pt.isel.jagoz.domain.payment

data class ChargeItem(
    val chargeItemId: Long,
    val chargeId: Long,
    val season: String,
    val month: Int,
    val amount: Int,
    val description: String,
)
