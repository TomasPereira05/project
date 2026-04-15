package pt.isel.event

import kotlinx.datetime.LocalDateTime
import java.util.UUID

// possivel passe anual.
data class Ticket(
    val ticketId: Long,
    val memberId: Long?,
    val buyerEmail: String,
    val buyerName: String,
    val eventId: Long,
    val price: Double,
    val qrCode: String = UUID.randomUUID().toString(),
    val used: Boolean = false,
    val usedAt: LocalDateTime? = null,
)
