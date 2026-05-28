package pt.isel.jagoz.repository.jdbi.mappers

import kotlinx.datetime.Instant
import org.jdbi.v3.core.mapper.RowMapper
import org.jdbi.v3.core.statement.StatementContext
import pt.isel.jagoz.domain.event.Event
import pt.isel.jagoz.domain.event.EventStatus
import java.sql.ResultSet

class EventMapper : RowMapper<Event> {
    override fun map(
        rs: ResultSet,
        ctx: StatementContext,
    ): Event =
        Event(
            eventId = rs.getLong("event_id"),
            name = rs.getString("name"),
            description = rs.getString("description"),
            startsAt = rs.getTimestamp("starts_at").toInstant().let { Instant.fromEpochMilliseconds(it.toEpochMilli()) },
            location = rs.getString("location"),
            priceNormal = rs.getInt("price_normal"),
            priceMember = rs.getInt("price_member"),
            status = EventStatus.valueOf(rs.getString("status")),
        )
}
