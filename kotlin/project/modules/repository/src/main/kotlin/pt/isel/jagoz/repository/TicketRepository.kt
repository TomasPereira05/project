package pt.isel.jagoz.repository.pt.isel.jagoz.repository

import kotlinx.datetime.LocalDateTime
import pt.isel.jagoz.event.Ticket

interface TicketRepository {
    fun findById(id: Long): Ticket?

    fun findByQrCode(qrCode: String): Ticket?

    fun findByEventId(eventId: Long): List<Ticket>

    fun save(ticket: Ticket): Long

    fun markAsUsed(
        ticketId: Long,
        usedAt: LocalDateTime,
    ): Boolean
}
