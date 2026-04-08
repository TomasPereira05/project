package pt.isel

import kotlinx.datetime.Clock
import kotlinx.datetime.LocalDate
import kotlinx.datetime.LocalDateTime
import pt.isel.event.Event
import pt.isel.event.EventDomain
import pt.isel.event.Ticket
import pt.isel.utils.Either
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class EventDomainTests {
    private val domain = EventDomain()

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
            price = 10.0,
            qrCode = "qr",
            used = used,
            usedAt = null,
        )

    @Test
    fun validateEvent_ok_and_failures() {
        val e = sampleEvent()
        val ok = domain.validateEventForCreation(e, Clock.System)
        assertTrue(ok is Either.Right)

        val past = sampleEvent(LocalDate.parse("2000-01-01"))
        val r = domain.validateEventForCreation(past, Clock.System)
        assertTrue(r is Either.Left)
    }

    @Test
    fun ticket_purchase_and_use_and_refund() {
        val t = sampleTicket()
        val ok = domain.validateTicketForPurchase(t)
        assertTrue(ok is Either.Right)

        val used = domain.markTicketUsed(t, LocalDateTime.parse("2027-01-01T10:00:00"))
        assertTrue(used is Either.Right)
        assertEquals(true, used.value.used)

        val refund = domain.validateRefundable(t)
        assertTrue(refund is Either.Right)

        val usedTicket = sampleTicket(used = true)
        val notRefundable = domain.validateRefundable(usedTicket)
        assertTrue(notRefundable is Either.Left)
    }
}
