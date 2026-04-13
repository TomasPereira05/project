package pt.isel.jagoz.repository.jdbi.mappers

import kotlinx.datetime.LocalDate
import pt.isel.jagoz.event.Event
import java.sql.ResultSet

object EventMapper {
    fun map(rs: ResultSet): Event =
        Event(
            eventId = rs.getLong("event_id"),
            name = rs.getString("name"),
            description = rs.getString("description"),
            date = LocalDate.parse(rs.getString("date")),
            location = rs.getString("location"),
        )
}
