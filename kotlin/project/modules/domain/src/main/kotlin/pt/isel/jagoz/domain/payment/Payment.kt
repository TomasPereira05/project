package pt.isel.jagoz.domain.payment

import kotlinx.datetime.LocalDateTime

data class Payment(
    val paymentId: Long,
    val chargeId: Long,
    // Montante em cÃªntimos (ex: 150 = 1.50â‚¬)
    val amount: Int,
    // STRIPE Ã© a plataforma que faz as transaÃ§Ãµes do dinheiro, campo sÃ³ dedicado a ele
    val provider: String,
    // sessionId/intentId
    val providerRef: String?,
    val status: PaymentStatus,
    val createdAt: LocalDateTime,
    val confirmedAt: LocalDateTime? = null,
)
