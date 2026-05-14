package pt.isel.jagoz.repository.jdbi

import kotlinx.datetime.LocalDateTime
import org.jdbi.v3.core.Handle
import pt.isel.jagoz.domain.event.Ticket
import pt.isel.jagoz.repository.TicketRepository

class JdbiTicketRepository(
    private val handle: Handle,
) : TicketRepository {
    override fun findById(id: Long): Ticket? =
        handle
            .createQuery("SELECT * FROM jagoz.ticket WHERE ticket_id = :id")
            .bind("id", id)
            .mapTo(Ticket::class.java)
            .findOne()
            .orElse(null)

    override fun findByQrCode(qrCode: String): Ticket? =
        handle
            .createQuery("SELECT * FROM jagoz.ticket WHERE qr_code = :qrCode")
            .bind("qrCode", qrCode)
            .mapTo(Ticket::class.java)
            .findOne()
            .orElse(null)

    override fun findByEventId(eventId: Long): List<Ticket> =
        handle
            .createQuery("SELECT * FROM jagoz.ticket WHERE event_id = :eventId")
            .bind("eventId", eventId)
            .mapTo(Ticket::class.java)
            .list()

    override fun save(ticket: Ticket): Long =
        handle
            .createUpdate(
                """
            INSERT INTO jagoz.ticket (member_id, buyer_email, buyer_name, event_id, price, qr_code, used, used_at)
            VALUES (:memberId, :buyerEmail, :buyerName, :eventId, :price, :qrCode, :used, :usedAt)
            """,
            ).bind("memberId", ticket.memberId)
            .bind("buyerEmail", ticket.buyerEmail)
            .bind("buyerName", ticket.buyerName)
            .bind("eventId", ticket.eventId)
            .bind("price", ticket.price)
            .bind("qrCode", ticket.qrCode)
            .bind("used", ticket.used)
            .bind("usedAt", ticket.usedAt)
            .executeAndReturnGeneratedKeys()
            .mapTo(Long::class.java)
            .one()

    override fun markAsUsed(
        ticketId: Long,
        usedAt: LocalDateTime,
    ): Boolean =
        handle
            .createUpdate(
                """
            UPDATE jagoz.ticket SET 
                used = true, 
                used_at = :usedAt
            WHERE ticket_id = :id AND used = false
            """,
            ).bind("id", ticketId)
            .bind("usedAt", usedAt)
            .execute() > 0
}
