package pt.isel.mappers

import kotlinx.datetime.LocalDateTime
import pt.isel.event.Ticket
import java.sql.ResultSet

object TicketMapper {
    fun map(rs: ResultSet): Ticket {
        val memberId = (rs.getObject("member_id") as? Number)?.toLong()

        return Ticket(
            ticketId = rs.getLong("ticket_id"),
            memberId = memberId,
            buyerEmail = rs.getString("buyer_email"),
            buyerName = rs.getString("buyer_name"),
            eventId = rs.getLong("event_id"),
            price = rs.getDouble("price"),
            qrCode = rs.getString("qr_code"),
            used = rs.getBoolean("used"),
            usedAt = rs.getString("used_at")?.let { LocalDateTime.parse(it.replace(" ", "T")) },
        )
    }
}
