package pt.isel.jagoz.repository.jdbi

import kotlinx.datetime.LocalDateTime
import org.jdbi.v3.core.Handle
import pt.isel.jagoz.event.Ticket
import pt.isel.jagoz.repository.jdbi.mappers.TicketMapper
import pt.isel.jagoz.repository.TicketRepository

class JdbiTicketRepository(private val handle: Handle) : TicketRepository {
    override fun findById(id: Long): Ticket? {
        return handle.createQuery("SELECT * FROM ticket WHERE ticket_id = :id")
            .bind("id", id)
            .mapTo(Ticket::class.java)
            .findOne()
            .orElse(null)
    }

    override fun findByQrCode(qrCode: String): Ticket? {
        return handle.createQuery("SELECT * FROM ticket WHERE qr_code = :qrCode")
            .bind("qrCode", qrCode)
            .mapTo(Ticket::class.java)
            .findOne()
            .orElse(null)
    }

    override fun findByEventId(eventId: Long): List<Ticket> {
        return handle.createQuery("SELECT * FROM ticket WHERE event_id = :eventId")
            .bind("eventId", eventId)
            .mapTo(Ticket::class.java)
            .list()
    }

    override fun save(ticket: Ticket): Long {
        return handle.createUpdate(
            """
            INSERT INTO ticket (member_id, buyer_email, buyer_name, event_id, price, qr_code, used, used_at)
            VALUES (:memberId, :buyerEmail, :buyerName, :eventId, :price, :qrCode, :used, CAST(:usedAt AS TIMESTAMP))
            """,
        )
            .bind("memberId", ticket.memberId)
            .bind("buyerEmail", ticket.buyerEmail)
            .bind("buyerName", ticket.buyerName)
            .bind("eventId", ticket.eventId)
            .bind("price", ticket.price)
            .bind("qrCode", ticket.qrCode)
            .bind("used", ticket.used)
            .bind("usedAt", ticket.usedAt?.toString()) // ISO format works for timestamp
            .executeAndReturnGeneratedKeys()
            .mapTo(Long::class.java)
            .one()
    }

    override fun markAsUsed(
        ticketId: Long,
        usedAt: LocalDateTime,
    ): Boolean {
        return handle.createUpdate(
            """
            UPDATE ticket SET 
                used = true, 
                used_at = CAST(:usedAt AS TIMESTAMP)
            WHERE ticket_id = :id AND used = false
            """,
        )
            .bind("id", ticketId)
            .bind("usedAt", usedAt.toString())
            .execute() > 0
    }
}
