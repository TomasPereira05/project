package pt.isel.jagoz.event

import kotlinx.datetime.Clock
import kotlinx.datetime.Instant
import kotlinx.datetime.LocalDateTime
import pt.isel.jagoz.domain.event.Event
import pt.isel.jagoz.domain.event.EventDomain
import pt.isel.jagoz.domain.event.Ticket
import pt.isel.jagoz.domain.event.TicketError
import pt.isel.jagoz.domain.event.TicketPriceType
import pt.isel.jagoz.domain.event.TicketStatus
import pt.isel.jagoz.domain.utils.Either
import pt.isel.jagoz.domain.utils.ValidationError
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertIs
import kotlin.test.assertTrue

class EventDomainTests {
    private val domain = EventDomain()

    private class FixedClock(
        private val instant: Instant,
    ) : Clock {
        override fun now(): Instant = instant
    }

    private val clock = FixedClock(Instant.parse("2026-06-01T12:00:00Z"))

    private fun sampleEvent(startsAt: Instant = Instant.parse("2027-01-01T20:00:00Z")) =
        Event(
            eventId = 1,
            name = "Match",
            description = "A big match",
            startsAt = startsAt,
            location = "Stadium",
            priceNormal = 1000,
            priceMember = 500,
        )

    private fun sampleTicket() =
        Ticket(
            ticketId = 1,
            eventId = 1,
            sectorId = 1,
            chargeId = null,
            priceType = TicketPriceType.NORMAL,
            price = 1000,
            buyerEmail = "buyer@example.com",
            buyerName = "Buyer",
        )

    private fun fieldError(res: Either<ValidationError, *>): String {
        val left = assertIs<Either.Left<*>>(res)
        return assertIs<ValidationError.FieldError>(left.value).field
    }

    // ---- validateEventForCreation ----

    @Test
    fun `validateEventForCreation accepts future event`() {
        assertTrue(domain.validateEventForCreation(sampleEvent(), clock) is Either.Right)
    }

    @Test
    fun `validateEventForCreation rejects past startsAt`() {
        val res = domain.validateEventForCreation(sampleEvent(Instant.parse("2020-01-01T20:00:00Z")), clock)
        assertEquals("startsAt", fieldError(res))
    }

    @Test
    fun `validateEventForCreation rejects blank name`() {
        assertEquals("name", fieldError(domain.validateEventForCreation(sampleEvent().copy(name = ""), clock)))
    }

    @Test
    fun `validateEventForCreation rejects blank location`() {
        assertEquals("location", fieldError(domain.validateEventForCreation(sampleEvent().copy(location = ""), clock)))
    }

    @Test
    fun `validateEventForCreation rejects member price above normal price`() {
        val res = domain.validateEventForCreation(sampleEvent().copy(priceNormal = 1000, priceMember = 1500), clock)
        assertEquals("priceMember", fieldError(res))
    }

    @Test
    fun `validateEventForCreation accepts member price equal to normal price`() {
        // decisão: price_member <= price_normal é permitido (flexibilidade > regra estrita)
        val res = domain.validateEventForCreation(sampleEvent().copy(priceNormal = 1000, priceMember = 1000), clock)
        assertTrue(res is Either.Right)
    }

    @Test
    fun `validateEventForCreation accepts free event`() {
        val res = domain.validateEventForCreation(sampleEvent().copy(priceNormal = 0, priceMember = 0), clock)
        assertTrue(res is Either.Right)
    }

    // ---- validateTicketForPurchase ----

    @Test
    fun `validateTicketForPurchase accepts valid normal ticket`() {
        assertTrue(domain.validateTicketForPurchase(sampleTicket()) is Either.Right)
    }

    @Test
    fun `validateTicketForPurchase rejects blank buyerName`() {
        assertEquals("buyerName", fieldError(domain.validateTicketForPurchase(sampleTicket().copy(buyerName = ""))))
    }

    @Test
    fun `validateTicketForPurchase rejects invalid buyerEmail`() {
        assertEquals("buyerEmail", fieldError(domain.validateTicketForPurchase(sampleTicket().copy(buyerEmail = "bad"))))
    }

    @Test
    fun `validateTicketForPurchase rejects negative price`() {
        assertEquals("price", fieldError(domain.validateTicketForPurchase(sampleTicket().copy(price = -1))))
    }

    @Test
    fun `validateTicketForPurchase accepts zero price`() {
        assertTrue(domain.validateTicketForPurchase(sampleTicket().copy(price = 0)) is Either.Right)
    }

    @Test
    fun `validateTicketForPurchase rejects member ticket without memberId`() {
        val res = domain.validateTicketForPurchase(sampleTicket().copy(priceType = TicketPriceType.MEMBER, memberId = null))
        assertEquals("memberId", fieldError(res))
    }

    @Test
    fun `validateTicketForPurchase accepts member ticket with memberId`() {
        val res = domain.validateTicketForPurchase(sampleTicket().copy(priceType = TicketPriceType.MEMBER, memberId = 42))
        assertTrue(res is Either.Right)
    }

    // ---- markTicketUsed ----

    @Test
    fun `markTicketUsed flags confirmed ticket and sets usedAt`() {
        val at = LocalDateTime.parse("2027-01-01T10:00:00")
        val res = domain.markTicketUsed(sampleTicket().copy(status = TicketStatus.CONFIRMED), at)
        val ticket = assertIs<Ticket>(assertIs<Either.Right<*>>(res).value)
        assertEquals(TicketStatus.USED, ticket.status)
        assertEquals(at, ticket.usedAt)
    }

    @Test
    fun `markTicketUsed rejects already used ticket`() {
        val res = domain.markTicketUsed(sampleTicket().copy(status = TicketStatus.USED), LocalDateTime.parse("2027-01-01T10:00:00"))
        assertIs<TicketError.InvalidOperation>(assertIs<Either.Left<*>>(res).value)
    }

    @Test
    fun `markTicketUsed rejects ticket that is not confirmed`() {
        val res = domain.markTicketUsed(sampleTicket().copy(status = TicketStatus.RESERVED), LocalDateTime.parse("2027-01-01T10:00:00"))
        assertIs<TicketError.InvalidOperation>(assertIs<Either.Left<*>>(res).value)
    }

    // ---- validateRefundable ----

    @Test
    fun `validateRefundable accepts confirmed ticket`() {
        assertTrue(domain.validateRefundable(sampleTicket().copy(status = TicketStatus.CONFIRMED)) is Either.Right)
    }

    @Test
    fun `validateRefundable rejects used ticket`() {
        val res = domain.validateRefundable(sampleTicket().copy(status = TicketStatus.USED))
        assertIs<TicketError.InvalidOperation>(assertIs<Either.Left<*>>(res).value)
    }
}
