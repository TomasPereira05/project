package pt.isel.jagoz.repository.jdbi.mappers

import kotlinx.datetime.LocalDate
import org.jdbi.v3.core.mapper.RowMapper
import org.jdbi.v3.core.statement.StatementContext
import pt.isel.jagoz.event.Event
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
            date = LocalDate.parse(rs.getString("date")),
            location = rs.getString("location"),
        )
}
