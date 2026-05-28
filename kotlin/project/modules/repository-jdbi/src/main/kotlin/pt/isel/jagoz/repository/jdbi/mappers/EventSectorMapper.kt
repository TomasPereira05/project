package pt.isel.jagoz.repository.jdbi.mappers

import org.jdbi.v3.core.mapper.RowMapper
import org.jdbi.v3.core.statement.StatementContext
import pt.isel.jagoz.domain.event.EventSector
import java.sql.ResultSet

class EventSectorMapper : RowMapper<EventSector> {
    override fun map(
        rs: ResultSet,
        ctx: StatementContext,
    ): EventSector =
        EventSector(
            sectorId = rs.getLong("sector_id"),
            eventId = rs.getLong("event_id"),
            name = rs.getString("name"),
            capacity = rs.getInt("capacity"),
            occupied = rs.getInt("occupied"),
        )
}
