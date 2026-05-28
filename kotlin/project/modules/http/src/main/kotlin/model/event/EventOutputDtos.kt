package pt.isel.jagoz.http.model.event

import pt.isel.jagoz.domain.event.EventSector
import pt.isel.jagoz.domain.event.EventStatus
import pt.isel.jagoz.domain.event.TicketPriceType
import pt.isel.jagoz.domain.event.TicketStatus
import pt.isel.jagoz.service.EventWithSectors
import pt.isel.jagoz.service.TicketWithSector

data class SectorOutput(
    val sectorId: Long,
    val name: String,
    val capacity: Int,
    val occupied: Int,
    val available: Int,
)

data class EventOutput(
    val eventId: Long,
    val name: String,
    val description: String,
    // ISO-8601 (UTC); o frontend formata em Europe/Lisbon
    val startsAt: String,
    val location: String,
    val status: EventStatus,
    // preços em cêntimos
    val priceNormal: Int,
    val priceMember: Int,
    // capacidade total derivada da soma dos setores (decisão A)
    val capacityTotal: Int,
    val sectors: List<SectorOutput>,
)

data class EventTicketOutput(
    val ticketId: Long,
    val buyerName: String,
    val buyerEmail: String,
    val sectorName: String,
    val priceType: TicketPriceType,
    val price: Int,
    val status: TicketStatus,
    val qrCode: String?,
    val usedAt: String?,
)

fun EventSector.toOutput() =
    SectorOutput(
        sectorId = sectorId,
        name = name,
        capacity = capacity,
        occupied = occupied,
        available = available,
    )

fun EventWithSectors.toOutput() =
    EventOutput(
        eventId = event.eventId,
        name = event.name,
        description = event.description,
        startsAt = event.startsAt.toString(),
        location = event.location,
        status = event.status,
        priceNormal = event.priceNormal,
        priceMember = event.priceMember,
        capacityTotal = sectors.sumOf { it.capacity },
        sectors = sectors.map { it.toOutput() },
    )

fun TicketWithSector.toOutput() =
    EventTicketOutput(
        ticketId = ticket.ticketId,
        buyerName = ticket.buyerName,
        buyerEmail = ticket.buyerEmail,
        sectorName = sectorName,
        priceType = ticket.priceType,
        price = ticket.price,
        status = ticket.status,
        qrCode = ticket.qrCode,
        usedAt = ticket.usedAt?.toString(),
    )
