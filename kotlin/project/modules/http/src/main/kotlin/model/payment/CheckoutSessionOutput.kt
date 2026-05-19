package pt.isel.jagoz.http.model.payment

import pt.isel.jagoz.service.CheckoutSessionResult

data class CheckoutSessionOutput(
    val paymentId: Long,
    val chargeId: Long,
    val sessionId: String,
    val checkoutUrl: String,
)

fun CheckoutSessionResult.toOutput(): CheckoutSessionOutput =
    CheckoutSessionOutput(
        paymentId = paymentId,
        chargeId = chargeId,
        sessionId = sessionId,
        checkoutUrl = checkoutUrl,
    )
