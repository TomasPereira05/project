package pt.isel.jagoz.repository.jdbi.mappers

import kotlinx.datetime.LocalDateTime
import org.jdbi.v3.core.mapper.RowMapper
import org.jdbi.v3.core.statement.StatementContext
import pt.isel.jagoz.domain.event.Ticket
import java.sql.ResultSet

class TicketMapper : RowMapper<Ticket> {
    override fun map(
        rs: ResultSet,
        ctx: StatementContext,
    ): Ticket {
        val memberId = (rs.getObject("member_id") as? Number)?.toLong()

        return Ticket(
            ticketId = rs.getLong("ticket_id"),
            memberId = memberId,
            buyerEmail = rs.getString("buyer_email"),
            buyerName = rs.getString("buyer_name"),
            eventId = rs.getLong("event_id"),
            price = rs.getInt("price"),
            qrCode = rs.getString("qr_code"),
            used = rs.getBoolean("used"),
            usedAt = rs.getString("used_at")?.let { LocalDateTime.parse(it.replace(" ", "T")) },
        )
    }
}
