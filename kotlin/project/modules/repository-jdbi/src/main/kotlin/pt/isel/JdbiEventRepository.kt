package pt.isel

import org.jdbi.v3.core.Handle
import pt.isel.mappers.EventMapper
import pt.isel.event.Event

class JdbiEventRepository(private val handle: Handle) : EventRepository {

    override fun findById(id: Long): Event? {
        return handle.createQuery("SELECT * FROM event WHERE event_id = :id")
            .bind("id", id)
            .map { rs, _ -> EventMapper.map(rs) }
            .findOne()
            .orElse(null)
    }

    override fun findAll(): List<Event> {
        return handle.createQuery("SELECT * FROM event ORDER BY date DESC")
            .map { rs, _ -> EventMapper.map(rs) }
            .list()
    }

    override fun save(event: Event): Long {
        return handle.createUpdate(
            """
            INSERT INTO event (name, description, date, location)
            VALUES (:name, :description, CAST(:date AS DATE), :location)
            """
        )
            .bind("name", event.name)
            .bind("description", event.description)
            .bind("date", event.date.toString())
            .bind("location", event.location)
            .executeAndReturnGeneratedKeys()
            .mapTo(Long::class.java)
            .one()
    }
}
