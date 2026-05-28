package pt.isel.jagoz.repository

import pt.isel.jagoz.domain.event.Event
import pt.isel.jagoz.domain.event.EventListFilter
import pt.isel.jagoz.domain.event.EventSector

interface EventRepository {
    fun findById(id: Long): Event?

    fun findByFilter(filter: EventListFilter): List<Event>

    fun save(event: Event): Long

    fun update(event: Event)

    // ---- setores (parte do agregado Evento) ----

    fun saveSector(sector: EventSector): Long

    fun updateSector(sector: EventSector)

    fun deleteSector(sectorId: Long)

    fun findSectorsByEvent(eventId: Long): List<EventSector>

    fun findSectorById(sectorId: Long): EventSector?

    /** Reserva 1 lugar de forma atómica. False se o setor já está cheio. */
    fun reserveSeat(sectorId: Long): Boolean

    /** Liberta 1 lugar. False se já estava a 0. */
    fun releaseSeat(sectorId: Long): Boolean
}
