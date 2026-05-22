package pt.isel.jagoz.event

import kotlinx.datetime.Clock
import kotlinx.datetime.Instant
import kotlinx.datetime.LocalDate
import kotlinx.datetime.LocalDateTime
import pt.isel.jagoz.domain.event.Event
import pt.isel.jagoz.domain.event.EventDomain
import pt.isel.jagoz.domain.event.Ticket
import pt.isel.jagoz.domain.event.TicketError
import pt.isel.jagoz.domain.utils.Either
import pt.isel.jagoz.domain.utils.ValidationError
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertIs
import kotlin.test.assertNotNull
import kotlin.test.assertTrue

class EventDomainTests {
    private val domain = EventDomain()

    private class FixedClock(
        private val instant: Instant,
    ) : Clock {
        override fun now(): Instant = instant
    }

    private fun sampleEvent(date: LocalDate = LocalDate.parse("2027-01-01")) =
        Event(
            eventId = 1,
            name = "Match",
            description = "A big match",
            date = date,
            location = "Stadium",
        )

    private fun sampleTicket(used: Boolean = false) =
        Ticket(
            ticketId = 1,
            memberId = null,
            buyerEmail = "buyer@example.com",
            buyerName = "Buyer",
            eventId = 1,
            price = 1000,
            qrCode = "qr",
            used = used,
            usedAt = null,
        )

    // ---- validateEventForCreation ----

    @Test
    fun `validateEventForCreation accepts future event`() {
        val res = domain.validateEventForCreation(sampleEvent(), Clock.System)
        assertTrue(res is Either.Right)
    }

    @Test
    fun `validateEventForCreation rejects past date`() {
        val past = sampleEvent(LocalDate.parse("2000-01-01"))
        val res = domain.validateEventForCreation(past, Clock.System)
        assertTrue(res is Either.Left)
        val err = assertIs<ValidationError.FieldError>(res.value)
        assertEquals("date", err.field)
    }

    @Test
    fun `validateEventForCreation rejects blank name`() {
        val res = domain.validateEventForCreation(sampleEvent().copy(name = ""), Clock.System)
        assertTrue(res is Either.Left)
        val err = assertIs<ValidationError.FieldError>(res.value)
        assertEquals("name", err.field)
    }

    @Test
    fun `validateEventForCreation rejects blank location`() {
        val res = domain.validateEventForCreation(sampleEvent().copy(location = ""), Clock.System)
        assertTrue(res is Either.Left)
        val err = assertIs<ValidationError.FieldError>(res.value)
        assertEquals("location", err.field)
    }

    @Test
    fun `validateEventForCreation accepts event on today's date`() {
        val today = LocalDate.parse("2027-06-15")
        // 2027-06-15T12:00 UTC
        val clock = FixedClock(Instant.parse("2027-06-15T12:00:00Z"))
        val res = domain.validateEventForCreation(sampleEvent(today), clock)
        assertTrue(res is Either.Right)
    }

    // ---- validateTicketForPurchase ----

    @Test
    fun `validateTicketForPurchase accepts valid ticket`() {
        val res = domain.validateTicketForPurchase(sampleTicket())
        assertTrue(res is Either.Right)
    }

    @Test
    fun `validateTicketForPurchase rejects blank buyerName`() {
        val res = domain.validateTicketForPurchase(sampleTicket().copy(buyerName = ""))
        assertTrue(res is Either.Left)
        val err = assertIs<ValidationError.FieldError>(res.value)
        assertEquals("buyerName", err.field)
    }

    @Test
    fun `validateTicketForPurchase rejects invalid buyerEmail`() {
        val res = domain.validateTicketForPurchase(sampleTicket().copy(buyerEmail = "bad"))
        assertTrue(res is Either.Left)
        val err = assertIs<ValidationError.FieldError>(res.value)
        assertEquals("buyerEmail", err.field)
    }

    @Test
    fun `validateTicketForPurchase rejects negative price`() {
        val res = domain.validateTicketForPurchase(sampleTicket().copy(price = -1))
        assertTrue(res is Either.Left)
        val err = assertIs<ValidationError.FieldError>(res.value)
        assertEquals("price", err.field)
    }

    @Test
    fun `validateTicketForPurchase accepts zero price`() {
        val res = domain.validateTicketForPurchase(sampleTicket().copy(price = 0))
        assertTrue(res is Either.Right)
    }

    // ---- markTicketUsed ----

    @Test
    fun `markTicketUsed flags ticket and sets usedAt`() {
        val at = LocalDateTime.parse("2027-01-01T10:00:00")
        val res = domain.markTicketUsed(sampleTicket(), at)
        assertTrue(res is Either.Right)
        assertTrue(res.value.used)
        assertEquals(at, res.value.usedAt)
    }

    @Test
    fun `markTicketUsed rejects already used ticket`() {
        val res = domain.markTicketUsed(sampleTicket(used = true), LocalDateTime.parse("2027-01-01T10:00:00"))
        assertTrue(res is Either.Left)
        assertIs<TicketError.InvalidOperation>(res.value)
    }

    // ---- validateRefundable ----

    @Test
    fun `validateRefundable accepts unused ticket`() {
        val res = domain.validateRefundable(sampleTicket())
        assertTrue(res is Either.Right)
    }

    @Test
    fun `validateRefundable rejects used ticket`() {
        val res = domain.validateRefundable(sampleTicket(used = true))
        assertTrue(res is Either.Left)
        assertIs<TicketError.InvalidOperation>(res.value)
    }

    // ---- Ticket model ----

    @Test
    fun `Ticket has UUID default qrCode when omitted`() {
        val t =
            Ticket(
                ticketId = 99,
                memberId = null,
                buyerEmail = "x@y.com",
                buyerName = "X",
                eventId = 1,
                price = 500,
            )
        assertNotNull(t.qrCode)
        assertTrue(t.qrCode.isNotBlank())
    }
}
