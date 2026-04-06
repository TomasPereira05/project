package pt.isel.event

import kotlinx.datetime.LocalDate

data class Event(
    val eventId: Long,
    val name: String,
    val description: String,
    val date: LocalDate,
    val location: String,
)
