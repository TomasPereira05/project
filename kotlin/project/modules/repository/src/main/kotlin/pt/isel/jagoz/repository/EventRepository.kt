package pt.isel.jagoz.repository

import pt.isel.jagoz.domain.event.Event

interface EventRepository {
    fun findById(id: Long): Event?

    fun findAll(): List<Event>

    fun save(event: Event): Long
}
