package pt.isel.jagoz.repository.jdbi

import org.jdbi.v3.core.Handle
import pt.isel.jagoz.domain.event.Event
import pt.isel.jagoz.domain.event.EventListFilter
import pt.isel.jagoz.domain.event.EventSector
import pt.isel.jagoz.repository.EventRepository

class JdbiEventRepository(
    private val handle: Handle,
) : EventRepository {
    override fun findById(id: Long): Event? =
        handle
            .createQuery("SELECT * FROM jagoz.event WHERE event_id = :id")
            .bind("id", id)
            .mapTo(Event::class.java)
            .findOne()
            .orElse(null)

    override fun findByFilter(filter: EventListFilter): List<Event> {
        // cláusulas controladas pelo enum (sem input do utilizador), seguras a interpolar
        val where =
            when (filter) {
                EventListFilter.ALL -> ""
                EventListFilter.SCHEDULED -> "WHERE status = 'SCHEDULED' AND starts_at > now()"
                EventListFilter.PAST -> "WHERE status = 'SCHEDULED' AND starts_at <= now()"
                EventListFilter.CANCELLED -> "WHERE status = 'CANCELLED'"
            }
        val order = if (filter == EventListFilter.SCHEDULED) "ASC" else "DESC"
        return handle
            .createQuery("SELECT * FROM jagoz.event $where ORDER BY starts_at $order")
            .mapTo(Event::class.java)
            .list()
    }

    override fun save(event: Event): Long =
        handle
            .createUpdate(
                """
                INSERT INTO jagoz.event (name, description, starts_at, location, status, price_normal, price_member)
                VALUES (:name, :description, :startsAt, :location, CAST(:status AS jagoz.event_status), :priceNormal, :priceMember)
                """,
            ).bind("name", event.name)
            .bind("description", event.description)
            .bind("startsAt", event.startsAt)
            .bind("location", event.location)
            .bind("status", event.status.name)
            .bind("priceNormal", event.priceNormal)
            .bind("priceMember", event.priceMember)
            .executeAndReturnGeneratedKeys()
            .mapTo(Long::class.java)
            .one()

    override fun update(event: Event) {
        handle
            .createUpdate(
                """
                UPDATE jagoz.event SET
                    name = :name,
                    description = :description,
                    starts_at = :startsAt,
                    location = :location,
                    status = CAST(:status AS jagoz.event_status),
                    price_normal = :priceNormal,
                    price_member = :priceMember
                WHERE event_id = :id
                """,
            ).bind("id", event.eventId)
            .bind("name", event.name)
            .bind("description", event.description)
            .bind("startsAt", event.startsAt)
            .bind("location", event.location)
            .bind("status", event.status.name)
            .bind("priceNormal", event.priceNormal)
            .bind("priceMember", event.priceMember)
            .execute()
    }

    override fun saveSector(sector: EventSector): Long =
        handle
            .createUpdate(
                """
                INSERT INTO jagoz.event_sector (event_id, name, capacity, occupied)
                VALUES (:eventId, :name, :capacity, :occupied)
                """,
            ).bind("eventId", sector.eventId)
            .bind("name", sector.name)
            .bind("capacity", sector.capacity)
            .bind("occupied", sector.occupied)
            .executeAndReturnGeneratedKeys()
            .mapTo(Long::class.java)
            .one()

    override fun updateSector(sector: EventSector) {
        handle
            .createUpdate(
                "UPDATE jagoz.event_sector SET name = :name, capacity = :capacity WHERE sector_id = :id",
            ).bind("id", sector.sectorId)
            .bind("name", sector.name)
            .bind("capacity", sector.capacity)
            .execute()
    }

    override fun deleteSector(sectorId: Long) {
        handle
            .createUpdate("DELETE FROM jagoz.event_sector WHERE sector_id = :id")
            .bind("id", sectorId)
            .execute()
    }

    override fun findSectorsByEvent(eventId: Long): List<EventSector> =
        handle
            .createQuery("SELECT * FROM jagoz.event_sector WHERE event_id = :eventId ORDER BY sector_id ASC")
            .bind("eventId", eventId)
            .mapTo(EventSector::class.java)
            .list()

    override fun findSectorById(sectorId: Long): EventSector? =
        handle
            .createQuery("SELECT * FROM jagoz.event_sector WHERE sector_id = :id")
            .bind("id", sectorId)
            .mapTo(EventSector::class.java)
            .findOne()
            .orElse(null)

    override fun reserveSeat(sectorId: Long): Boolean =
        handle
            .createUpdate(
                "UPDATE jagoz.event_sector SET occupied = occupied + 1 WHERE sector_id = :id AND occupied < capacity",
            ).bind("id", sectorId)
            .execute() > 0

    override fun releaseSeat(sectorId: Long): Boolean =
        handle
            .createUpdate(
                "UPDATE jagoz.event_sector SET occupied = occupied - 1 WHERE sector_id = :id AND occupied > 0",
            ).bind("id", sectorId)
            .execute() > 0
}
