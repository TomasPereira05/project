package pt.isel.jagoz.repository.jdbi

import org.jdbi.v3.core.Handle
import pt.isel.jagoz.event.Event
import pt.isel.jagoz.repository.jdbi.mappers.EventMapper
import pt.isel.jagoz.repository.EventRepository

class JdbiEventRepository(private val handle: Handle) : EventRepository {
    override fun findById(id: Long): Event? {
        return handle.createQuery("SELECT * FROM event WHERE event_id = :id")
            .bind("id", id)
            .mapTo(Event::class.java)
            .findOne()
            .orElse(null)
    }

    override fun findAll(): List<Event> {
        return handle.createQuery("SELECT * FROM event ORDER BY date DESC")
            .mapTo(Event::class.java)
            .list()
    }

    override fun save(event: Event): Long {
        return handle.createUpdate(
            """
            INSERT INTO event (name, description, date, location)
            VALUES (:name, :description, CAST(:date AS DATE), :location)
            """,
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
