package pt.isel.jagoz.domain.event

import kotlinx.datetime.Instant

data class Event(
    val eventId: Long,
    val name: String,
    val description: String,
    // instante absoluto; renderizado em Europe/Lisbon nas bordas (frontend/email)
    val startsAt: Instant,
    val location: String,
    // preços em cêntimos
    val priceNormal: Int,
    val priceMember: Int,
    val status: EventStatus = EventStatus.SCHEDULED,
)
