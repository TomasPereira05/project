package pt.isel.payment

import kotlinx.datetime.LocalDateTime

data class Payment(
    val paymentId: Long,
    val chargeId: Long,
    val amount: Double,
    val provider: String, // STRIPE é a plataforma que faz as transações do dinheiro, campo só dedicado a ele
    val providerRef: String?, // sessionId/intentId
    val status: PaymentStatus,
    val createdAt: LocalDateTime,
    val confirmedAt: LocalDateTime? = null,
)
