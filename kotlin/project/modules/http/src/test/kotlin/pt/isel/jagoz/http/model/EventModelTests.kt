package pt.isel.jagoz.http.model

import kotlinx.datetime.Instant
import kotlinx.datetime.LocalDate
import kotlinx.datetime.LocalDateTime
import pt.isel.jagoz.domain.event.Event
import pt.isel.jagoz.domain.event.EventSector
import pt.isel.jagoz.domain.event.EventStatus
import pt.isel.jagoz.domain.event.Ticket
import pt.isel.jagoz.domain.event.TicketPriceType
import pt.isel.jagoz.domain.event.TicketStatus
import pt.isel.jagoz.http.model.event.EventCheckoutInput
import pt.isel.jagoz.http.model.event.EventCreateInput
import pt.isel.jagoz.http.model.event.EventUpdateInput
import pt.isel.jagoz.http.model.event.SectorInput
import pt.isel.jagoz.http.model.event.TicketLineInput
import pt.isel.jagoz.http.model.event.toDraft
import pt.isel.jagoz.http.model.event.toLine
import pt.isel.jagoz.http.model.event.toOutput
import pt.isel.jagoz.service.EventWithSectors
import pt.isel.jagoz.service.TicketWithSector
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNull

class EventModelTests {
    @Test
    fun `event create input maps to service draft`() {
        val draft =
            EventCreateInput(
                name = "GDUE vs Visitante",
                description = "Jogo em casa",
                startsAt = "2027-01-01T20:00",
                location = "Campo Henrique Tomás Frade",
                priceNormal = 500,
                priceMember = 250,
                sectors =
                    listOf(
                        SectorInput(sectorId = null, name = "Casa", capacity = 100),
                        SectorInput(sectorId = 2, name = "Visitante", capacity = 50),
                    ),
            ).toDraft()

        assertEquals("GDUE vs Visitante", draft.name)
        assertEquals("2027-01-01T20:00", draft.startsAtLocal)
        assertEquals(500, draft.priceNormal)
        assertEquals(250, draft.priceMember)
        assertEquals(2, draft.sectors.size)
        assertNull(draft.sectors.first().sectorId)
        assertEquals(2, draft.sectors.last().sectorId)
    }

    @Test
    fun `event update input maps to same draft shape`() {
        val draft =
            EventUpdateInput(
                name = "Atualizado",
                description = "Descricao",
                startsAt = "2027-02-01T18:30",
                location = "Ericeira",
                priceNormal = 700,
                priceMember = 400,
                sectors = listOf(SectorInput(1, "Bancada", 120)),
            ).toDraft()

        assertEquals("Atualizado", draft.name)
        assertEquals("2027-02-01T18:30", draft.startsAtLocal)
        assertEquals(1, draft.sectors.single().sectorId)
    }

    @Test
    fun `checkout ticket line maps member price case-insensitively and parses birth date`() {
        val line =
            TicketLineInput(
                sectorId = 3,
                priceType = "member",
                memberNumber = 1001,
                memberBirthDate = "1990-07-22",
            ).toLine()

        assertEquals(3, line.sectorId)
        assertEquals(TicketPriceType.MEMBER, line.priceType)
        assertEquals(1001, line.memberNumber)
        assertEquals(LocalDate.parse("1990-07-22"), line.memberBirthDate)
    }

    @Test
    fun `checkout ticket line defaults unknown price type to normal and ignores invalid date`() {
        val line =
            TicketLineInput(
                sectorId = 4,
                priceType = "vip",
                memberNumber = 1002,
                memberBirthDate = "not-a-date",
            ).toLine()

        assertEquals(TicketPriceType.NORMAL, line.priceType)
        assertNull(line.memberBirthDate)
    }

    @Test
    fun `checkout input maps all lines to purchase draft`() {
        val draft =
            EventCheckoutInput(
                buyerName = "Comprador",
                buyerEmail = "buyer@example.test",
                lines =
                    listOf(
                        TicketLineInput(1, "NORMAL"),
                        TicketLineInput(2, "MEMBER", 1001, "1980-01-01"),
                    ),
            ).toDraft()

        assertEquals("Comprador", draft.buyerName)
        assertEquals("buyer@example.test", draft.buyerEmail)
        assertEquals(2, draft.lines.size)
        assertEquals(TicketPriceType.NORMAL, draft.lines.first().priceType)
        assertEquals(TicketPriceType.MEMBER, draft.lines.last().priceType)
    }

    @Test
    fun `event with sectors maps to output with derived total capacity and availability`() {
        val output =
            EventWithSectors(
                event =
                    Event(
                        eventId = 9,
                        name = "Evento",
                        description = "Descricao",
                        startsAt = Instant.parse("2027-01-01T20:00:00Z"),
                        location = "Campo",
                        priceNormal = 1000,
                        priceMember = 500,
                        status = EventStatus.SCHEDULED,
                    ),
                sectors =
                    listOf(
                        EventSector(1, 9, "Casa", capacity = 100, occupied = 25),
                        EventSector(2, 9, "Visitante", capacity = 50, occupied = 10),
                    ),
            ).toOutput()

        assertEquals(9, output.eventId)
        assertEquals("2027-01-01T20:00:00Z", output.startsAt)
        assertEquals(150, output.capacityTotal)
        assertEquals(75, output.sectors.first().available)
        assertEquals(40, output.sectors.last().available)
    }

    @Test
    fun `ticket with sector maps to ticket output with usedAt string`() {
        val output =
            TicketWithSector(
                ticket =
                    Ticket(
                        ticketId = 12,
                        eventId = 9,
                        sectorId = 1,
                        chargeId = 3,
                        memberId = 11,
                        memberNumber = 1001,
                        priceType = TicketPriceType.MEMBER,
                        price = 500,
                        buyerEmail = "buyer@example.test",
                        buyerName = "Comprador",
                        status = TicketStatus.USED,
                        qrCode = "qr-1",
                        usedAt = LocalDateTime.parse("2027-01-01T21:00:00"),
                    ),
                sectorName = "Casa",
            ).toOutput()

        assertEquals(12, output.ticketId)
        assertEquals("Casa", output.sectorName)
        assertEquals(TicketPriceType.MEMBER, output.priceType)
        assertEquals(TicketStatus.USED, output.status)
        assertEquals("2027-01-01T21:00", output.usedAt)
    }
}
