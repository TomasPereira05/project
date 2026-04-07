package pt.isel

import pt.isel.event.Event

interface EventRepository {
    fun findById(id: Long): Event?

    fun findAll(): List<Event>

    fun save(event: Event): Long
}
