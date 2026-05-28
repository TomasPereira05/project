package pt.isel.jagoz.domain.payment

data class ChargeItemWithStatus(
    val item: ChargeItem,
    val chargeStatus: ChargeStatus,
    val paymentId: Long?,
)
