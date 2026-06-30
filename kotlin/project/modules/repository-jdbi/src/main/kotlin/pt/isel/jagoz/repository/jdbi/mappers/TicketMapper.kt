package pt.isel.jagoz.repository.jdbi.mappers

import kotlinx.datetime.Instant
import org.jdbi.v3.core.mapper.RowMapper
import org.jdbi.v3.core.statement.StatementContext
import pt.isel.jagoz.domain.event.Ticket
import pt.isel.jagoz.domain.event.TicketPriceType
import pt.isel.jagoz.domain.event.TicketStatus
import java.sql.ResultSet

class TicketMapper : RowMapper<Ticket> {
    override fun map(
        rs: ResultSet,
        ctx: StatementContext,
    ): Ticket =
        Ticket(
            ticketId = rs.getLong("ticket_id"),
            eventId = rs.getLong("event_id"),
            sectorId = rs.getLong("sector_id"),
            chargeId = (rs.getObject("charge_id") as? Number)?.toLong(),
            memberId = (rs.getObject("member_id") as? Number)?.toLong(),
            memberNumber = (rs.getObject("member_number") as? Number)?.toInt(),
            priceType = TicketPriceType.valueOf(rs.getString("price_type")),
            price = rs.getInt("price"),
            buyerEmail = rs.getString("buyer_email"),
            buyerName = rs.getString("buyer_name"),
            status = TicketStatus.valueOf(rs.getString("status")),
            qrCode = rs.getString("qr_code"),
            // used_at é TIMESTAMPTZ; lê-se como Instant, igual ao TokenMapper/PaymentMapper.
            usedAt = rs.getTimestamp("used_at")?.toInstant()?.let { Instant.fromEpochMilliseconds(it.toEpochMilli()) },
        )
}
