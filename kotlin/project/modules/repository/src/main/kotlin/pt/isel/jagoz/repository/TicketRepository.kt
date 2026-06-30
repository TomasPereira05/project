package pt.isel.jagoz.repository

import kotlinx.datetime.Instant
import pt.isel.jagoz.domain.event.Ticket

interface TicketRepository {
    fun findById(id: Long): Ticket?

    fun findByQrCode(qrCode: String): Ticket?

    fun findByEventId(eventId: Long): List<Ticket>

    fun findByChargeId(chargeId: Long): List<Ticket>

    fun findByBuyerEmail(email: String): List<Ticket>

    fun findByMemberId(memberId: Long): List<Ticket>

    /** Decisão #6: 1 bilhete-sócio ativo por sócio por evento. */
    fun existsActiveMemberTicket(
        eventId: Long,
        memberId: Long,
    ): Boolean

    fun save(ticket: Ticket): Long

    /** RESERVED -> CONFIRMED, atribuindo o qrCode. False se já não estava reservado. */
    fun confirm(
        ticketId: Long,
        qrCode: String,
    ): Boolean

    /** RESERVED/CONFIRMED -> CANCELLED. False se já estava cancelado/usado. */
    fun cancel(ticketId: Long): Boolean

    fun markAsUsed(
        ticketId: Long,
        usedAt: Instant,
    ): Boolean
}
