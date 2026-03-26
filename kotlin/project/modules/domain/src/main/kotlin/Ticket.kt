package pt.isel

import kotlinx.datetime.LocalDateTime
import java.util.UUID

data class Ticket(
    val ticketId: Long,
    val memberId: Long,
    val eventId: Long,
    val price: Double,
    val qrCode: String = UUID.randomUUID().toString(),
    val used: Boolean = false,
    val usedAt: LocalDateTime? = null,
)
