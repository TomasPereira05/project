package pt.isel.jagoz.repository.pt.isel.jagoz.repository

import pt.isel.jagoz.event.Event

interface EventRepository {
    fun findById(id: Long): Event?

    fun findAll(): List<Event>

    fun save(event: Event): Long
}
