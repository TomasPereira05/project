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
            .createQuery("SELECT * FROM jagoz.ticket WHERE event_id = :eventId ORDER BY ticket_id ASC")
            .bind("eventId", eventId)
            .mapTo(Ticket::class.java)
            .list()

    override fun findByChargeId(chargeId: Long): List<Ticket> =
        handle
            .createQuery("SELECT * FROM jagoz.ticket WHERE charge_id = :chargeId ORDER BY ticket_id ASC")
            .bind("chargeId", chargeId)
            .mapTo(Ticket::class.java)
            .list()

    override fun findByBuyerEmail(email: String): List<Ticket> =
        handle
            .createQuery("SELECT * FROM jagoz.ticket WHERE lower(buyer_email) = lower(:email) ORDER BY ticket_id DESC")
            .bind("email", email)
            .mapTo(Ticket::class.java)
            .list()

    override fun findByMemberId(memberId: Long): List<Ticket> =
        handle
            .createQuery("SELECT * FROM jagoz.ticket WHERE member_id = :memberId ORDER BY ticket_id DESC")
            .bind("memberId", memberId)
            .mapTo(Ticket::class.java)
            .list()

    override fun existsActiveMemberTicket(
        eventId: Long,
        memberId: Long,
    ): Boolean =
        handle
            .createQuery(
                """
                SELECT COUNT(*) FROM jagoz.ticket
                WHERE event_id = :eventId AND member_id = :memberId
                  AND price_type = 'MEMBER' AND status <> 'CANCELLED'
                """,
            ).bind("eventId", eventId)
            .bind("memberId", memberId)
            .mapTo(Int::class.java)
            .one() > 0

    override fun save(ticket: Ticket): Long =
        handle
            .createUpdate(
                """
                INSERT INTO jagoz.ticket
                    (event_id, sector_id, charge_id, member_id, member_number, price_type, price, buyer_email, buyer_name, status, qr_code, used_at)
                VALUES
                    (:eventId, :sectorId, :chargeId, :memberId, :memberNumber, CAST(:priceType AS jagoz.ticket_price_type), :price, :buyerEmail, :buyerName, CAST(:status AS jagoz.ticket_status), :qrCode, :usedAt)
                """,
            ).bind("eventId", ticket.eventId)
            .bind("sectorId", ticket.sectorId)
            .bind("chargeId", ticket.chargeId)
            .bind("memberId", ticket.memberId)
            .bind("memberNumber", ticket.memberNumber)
            .bind("priceType", ticket.priceType.name)
            .bind("price", ticket.price)
            .bind("buyerEmail", ticket.buyerEmail)
            .bind("buyerName", ticket.buyerName)
            .bind("status", ticket.status.name)
            .bind("qrCode", ticket.qrCode)
            .bind("usedAt", ticket.usedAt)
            .executeAndReturnGeneratedKeys()
            .mapTo(Long::class.java)
            .one()

    override fun confirm(
        ticketId: Long,
        qrCode: String,
    ): Boolean =
        handle
            .createUpdate(
                "UPDATE jagoz.ticket SET status = 'CONFIRMED', qr_code = :qrCode WHERE ticket_id = :id AND status = 'RESERVED'",
            ).bind("id", ticketId)
            .bind("qrCode", qrCode)
            .execute() > 0

    override fun cancel(ticketId: Long): Boolean =
        handle
            .createUpdate(
                "UPDATE jagoz.ticket SET status = 'CANCELLED' WHERE ticket_id = :id AND status IN ('RESERVED', 'CONFIRMED')",
            ).bind("id", ticketId)
            .execute() > 0

    override fun markAsUsed(
        ticketId: Long,
        usedAt: LocalDateTime,
    ): Boolean =
        handle
            .createUpdate(
                "UPDATE jagoz.ticket SET status = 'USED', used_at = :usedAt WHERE ticket_id = :id AND status = 'CONFIRMED'",
            ).bind("id", ticketId)
            .bind("usedAt", usedAt)
            .execute() > 0
}
