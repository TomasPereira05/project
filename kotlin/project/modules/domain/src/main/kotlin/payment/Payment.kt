package pt.isel.payment

import kotlinx.datetime.LocalDateTime

data class Payment(
    val paymentId: Long,
    val chargeId: Long,
    // Montante em cêntimos (ex: 150 = 1.50€)
    val amount: Int,
    // STRIPE é a plataforma que faz as transações do dinheiro, campo só dedicado a ele
    val provider: String,
    // sessionId/intentId
    val providerRef: String?,
    val status: PaymentStatus,
    val createdAt: LocalDateTime,
    val confirmedAt: LocalDateTime? = null,
)
