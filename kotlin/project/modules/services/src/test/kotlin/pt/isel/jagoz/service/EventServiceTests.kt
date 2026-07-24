package pt.isel.jagoz.service

import kotlinx.datetime.Clock
import kotlinx.datetime.Instant
import kotlinx.datetime.LocalDate
import pt.isel.jagoz.domain.event.Event
import pt.isel.jagoz.domain.event.EventDomain
import pt.isel.jagoz.domain.event.EventError
import pt.isel.jagoz.domain.event.EventSector
import pt.isel.jagoz.domain.event.EventStatus
import pt.isel.jagoz.domain.event.Ticket
import pt.isel.jagoz.domain.event.TicketPriceType
import pt.isel.jagoz.domain.event.TicketStatus
import pt.isel.jagoz.domain.member.MemberStatus
import pt.isel.jagoz.domain.payment.PaymentDomain
import pt.isel.jagoz.domain.sponsor.SponsorDomain
import pt.isel.jagoz.domain.user.Role
import pt.isel.jagoz.domain.utils.Either
import pt.isel.jagoz.service.email.EmailSender
import pt.isel.jagoz.service.email.EmailService
import pt.isel.jagoz.service.pdf.PdfGenerator
import pt.isel.jagoz.service.qr.QrCodeGenerator
import kotlin.test.Test
import kotlin.test.assertContains
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertIs
import kotlin.test.assertNotNull
import kotlin.test.assertTrue
import kotlin.time.Duration.Companion.hours

class EventServiceTests {
    private val txManager = FakeTransactionManager()
    private val tx = txManager.tx
    private val service =
        EventService(
            txManager,
            EventDomain(),
            PaymentService(
                txManager,
                PaymentDomain(),
                SponsorDomain(),
                StripeProperties("sk_test_dummy", "whsec_dummy", "2023-10-16", "http://localhost:8080"),
                EmailService(NoopEmailSender(), QrCodeGenerator(), PdfGenerator()),
            ),
        )

    private fun seedEvent(
        eventId: Long = 1,
        startsAt: Instant = Clock.System.now() + 24.hours,
        status: EventStatus = EventStatus.SCHEDULED,
    ) = tx.eventRepository.seed(
        Event(
            eventId = eventId,
            name = "Jogo",
            description = "desc",
            startsAt = startsAt,
            location = "Estádio",
            priceNormal = 1000,
            priceMember = 500,
            status = status,
        ),
    )

    private fun seedSector(
        sectorId: Long = 1,
        eventId: Long = 1,
        capacity: Int = 10,
        occupied: Int = 0,
        name: String = "Bancada",
    ) = tx.eventRepository.seedSector(EventSector(sectorId, eventId, name, capacity, occupied))

    private fun seedTicket(
        ticketId: Long = 11,
        eventId: Long = 1,
        sectorId: Long = 1,
        status: TicketStatus = TicketStatus.CONFIRMED,
        qrCode: String? = "tok-1",
        memberId: Long? = null,
    ) = tx.ticketRepository.seed(
        Ticket(
            ticketId = ticketId,
            eventId = eventId,
            sectorId = sectorId,
            chargeId = null,
            memberId = memberId,
            priceType = TicketPriceType.NORMAL,
            price = 1000,
            buyerEmail = "buyer@example.test",
            buyerName = "Buyer",
            status = status,
            qrCode = qrCode,
        ),
    )

    private fun draft(vararg lines: TicketPurchaseLine) = TicketPurchaseDraft("Buyer", "buyer@example.test", lines.toList())

    private fun normalLine(sectorId: Long = 1) = TicketPurchaseLine(sectorId, TicketPriceType.NORMAL, null, null)

    private fun memberLine(
        memberNumber: Int?,
        birthDate: LocalDate?,
        sectorId: Long = 1,
    ) = TicketPurchaseLine(sectorId, TicketPriceType.MEMBER, memberNumber, birthDate)

    // ---- createEvent ----

    @Test
    fun `createEvent saves the event and its sectors`() {
        val draft =
            EventDraft(
                name = "Final",
                description = "desc",
                startsAtLocal = "2030-01-01T20:00",
                location = "Estádio",
                priceNormal = 1000,
                priceMember = 500,
                sectors = listOf(SectorDraft(null, " Casa ", 100), SectorDraft(null, "Visitante", 50)),
            )

        val result = service.createEvent(draft)

        val created = assertIs<Either.Right<EventWithSectors>>(result).value
        assertEquals("Final", created.event.name)
        assertEquals(EventStatus.SCHEDULED, created.event.status)
        assertEquals(listOf("Casa", "Visitante"), created.sectors.map { it.name })
        assertEquals(2, tx.eventRepository.sectors.size)
    }

    @Test
    fun `createEvent accepts datetime-local values without seconds`() {
        val draft = validEventDraft(startsAtLocal = "2030-06-15T21:30")

        assertIs<Either.Right<*>>(service.createEvent(draft))
    }

    @Test
    fun `createEvent rejects invalid or past start`() {
        assertIs<EventError.Validation>(
            assertIs<Either.Left<*>>(service.createEvent(validEventDraft(startsAtLocal = "not-a-date"))).value,
        )
        assertIs<EventError.Validation>(
            assertIs<Either.Left<*>>(service.createEvent(validEventDraft(startsAtLocal = "2020-01-01T20:00"))).value,
        )
    }

    @Test
    fun `createEvent validates the sector drafts`() {
        assertIs<EventError.Validation>(
            assertIs<Either.Left<*>>(service.createEvent(validEventDraft(sectors = emptyList()))).value,
        )
        assertIs<EventError.Validation>(
            assertIs<Either.Left<*>>(
                service.createEvent(validEventDraft(sectors = listOf(SectorDraft(null, " ", 10)))),
            ).value,
        )
        assertIs<EventError.Validation>(
            assertIs<Either.Left<*>>(
                service.createEvent(validEventDraft(sectors = listOf(SectorDraft(null, "A", 0)))),
            ).value,
        )
        assertIs<EventError.Validation>(
            assertIs<Either.Left<*>>(
                service.createEvent(validEventDraft(sectors = listOf(SectorDraft(null, "casa", 10), SectorDraft(null, "Casa ", 10)))),
            ).value,
        )
    }

    @Test
    fun `createEvent rejects member price above normal price`() {
        val result = service.createEvent(validEventDraft(priceNormal = 500, priceMember = 1000))

        assertIs<EventError.Validation>(assertIs<Either.Left<*>>(result).value)
    }

    private fun validEventDraft(
        startsAtLocal: String = "2030-01-01T20:00",
        priceNormal: Int = 1000,
        priceMember: Int = 500,
        sectors: List<SectorDraft> = listOf(SectorDraft(null, "Casa", 100)),
    ) = EventDraft("Final", "desc", startsAtLocal, "Estádio", priceNormal, priceMember, sectors)

    // ---- updateEvent ----

    @Test
    fun `updateEvent rejects unknown and cancelled events`() {
        seedEvent(eventId = 2, status = EventStatus.CANCELLED)

        assertIs<EventError.NotFound>(assertIs<Either.Left<*>>(service.updateEvent(99, validEventDraft())).value)
        assertIs<EventError.InvalidOperation>(assertIs<Either.Left<*>>(service.updateEvent(2, validEventDraft())).value)
    }

    @Test
    fun `updateEvent blocks a date change while non-cancelled tickets exist`() {
        seedEvent(eventId = 1)
        seedSector()
        seedTicket(status = TicketStatus.CONFIRMED)

        val result = service.updateEvent(1, validEventDraft(startsAtLocal = "2031-01-01T20:00"))

        val error = assertIs<EventError.InvalidOperation>(assertIs<Either.Left<*>>(result).value)
        assertContains(error.message, "cancel the event")
    }

    @Test
    fun `updateEvent applies the sector diff but never below sold seats`() {
        seedEvent(eventId = 1, startsAt = Instant.parse("2030-01-01T20:00:00Z"))
        seedSector(sectorId = 1, capacity = 10, occupied = 5)
        seedSector(sectorId = 2, capacity = 10, occupied = 0, name = "Visitante")

        val below =
            service.updateEvent(
                1,
                validEventDraft(startsAtLocal = "2030-01-01T20:00").copy(sectors = listOf(SectorDraft(1, "Bancada", 4))),
            )
        assertIs<EventError.InvalidOperation>(assertIs<Either.Left<*>>(below).value)

        val ok =
            service.updateEvent(
                1,
                validEventDraft(startsAtLocal = "2030-01-01T20:00").copy(
                    sectors = listOf(SectorDraft(1, "Bancada", 20), SectorDraft(null, "Nova", 30)),
                ),
            )
        assertIs<Either.Right<*>>(ok)
        assertEquals(
            20,
            tx.eventRepository.sectors
                .getValue(1)
                .capacity,
        )
        assertEquals(
            5,
            tx.eventRepository.sectors
                .getValue(1)
                .occupied,
        )
        assertFalse(tx.eventRepository.sectors.containsKey(2))
        assertTrue(
            tx.eventRepository.sectors.values
                .any { it.name == "Nova" },
        )
    }

    @Test
    fun `updateEvent refuses to remove a sector with sold tickets`() {
        seedEvent(eventId = 1, startsAt = Instant.parse("2030-01-01T20:00:00Z"))
        seedSector(sectorId = 1, capacity = 10, occupied = 5)

        val result =
            service.updateEvent(
                1,
                validEventDraft(startsAtLocal = "2030-01-01T20:00").copy(sectors = listOf(SectorDraft(null, "Outra", 10))),
            )

        assertIs<EventError.InvalidOperation>(assertIs<Either.Left<*>>(result).value)
    }

    // ---- cancelEvent ----

    @Test
    fun `cancelEvent cancels tickets and releases the seats once`() {
        seedEvent(eventId = 1)
        seedSector(sectorId = 1, capacity = 10, occupied = 2)
        seedTicket(ticketId = 11, status = TicketStatus.CONFIRMED)
        seedTicket(ticketId = 12, status = TicketStatus.RESERVED, qrCode = null)
        seedTicket(ticketId = 13, status = TicketStatus.CANCELLED, qrCode = null)

        val result = service.cancelEvent(1)

        assertIs<Either.Right<*>>(result)
        assertEquals(
            EventStatus.CANCELLED,
            tx.eventRepository.events
                .getValue(1)
                .status,
        )
        assertTrue(
            tx.ticketRepository.tickets.values
                .all { it.status == TicketStatus.CANCELLED },
        )
        assertEquals(
            0,
            tx.eventRepository.sectors
                .getValue(1)
                .occupied,
        )
    }

    @Test
    fun `cancelEvent rejects an already cancelled event`() {
        seedEvent(eventId = 1, status = EventStatus.CANCELLED)

        assertIs<EventError.InvalidOperation>(assertIs<Either.Left<*>>(service.cancelEvent(1)).value)
    }

    // ---- validateTicket (leitura do QR à porta) ----

    @Test
    fun `validateTicket consumes a confirmed ticket inside the entry window`() {
        seedEvent(eventId = 1, startsAt = Clock.System.now() + 1.hours)
        seedSector()
        seedTicket(qrCode = "tok-1")

        val result = service.validateTicket(1, "tok-1")

        val validation = assertIs<Either.Right<TicketValidationResult>>(result).value
        assertEquals(TicketValidationOutcome.VALID, validation.outcome)
        assertEquals(
            TicketStatus.USED,
            tx.ticketRepository.tickets
                .getValue(11)
                .status,
        )
        assertNotNull(
            tx.ticketRepository.tickets
                .getValue(11)
                .usedAt,
        )
    }

    @Test
    fun `the same qr code cannot enter twice`() {
        seedEvent(eventId = 1, startsAt = Clock.System.now() + 1.hours)
        seedSector()
        seedTicket(qrCode = "tok-1")

        service.validateTicket(1, "tok-1")
        val second = service.validateTicket(1, "tok-1")

        val validation = assertIs<Either.Right<TicketValidationResult>>(second).value
        assertEquals(TicketValidationOutcome.ALREADY_USED, validation.outcome)
    }

    @Test
    fun `a genuine ticket outside the entry window is not consumed`() {
        seedEvent(eventId = 1, startsAt = Clock.System.now() + 10.hours)
        seedSector()
        seedTicket(qrCode = "tok-1")

        val result = service.validateTicket(1, "tok-1")

        val validation = assertIs<Either.Right<TicketValidationResult>>(result).value
        assertEquals(TicketValidationOutcome.OUTSIDE_WINDOW, validation.outcome)
        assertEquals(
            TicketStatus.CONFIRMED,
            tx.ticketRepository.tickets
                .getValue(11)
                .status,
        )
    }

    @Test
    fun `validateTicket distinguishes unknown wrong-event cancelled and reserved tokens`() {
        seedEvent(eventId = 1, startsAt = Clock.System.now() + 1.hours)
        seedEvent(eventId = 2, startsAt = Clock.System.now() + 1.hours)
        seedSector(sectorId = 1, eventId = 1)
        seedSector(sectorId = 2, eventId = 2)
        seedTicket(ticketId = 11, eventId = 2, sectorId = 2, qrCode = "tok-other-event")
        seedTicket(ticketId = 12, status = TicketStatus.CANCELLED, qrCode = "tok-cancelled")
        seedTicket(ticketId = 13, status = TicketStatus.RESERVED, qrCode = "tok-reserved")

        fun outcome(token: String): TicketValidationOutcome =
            assertIs<Either.Right<TicketValidationResult>>(service.validateTicket(1, token)).value.outcome

        assertEquals(TicketValidationOutcome.INVALID, outcome("tok-unknown"))
        assertEquals(TicketValidationOutcome.WRONG_EVENT, outcome("tok-other-event"))
        assertEquals(TicketValidationOutcome.CANCELLED, outcome("tok-cancelled"))
        assertEquals(TicketValidationOutcome.INVALID, outcome("tok-reserved"))
    }

    @Test
    fun `validateTicket fails for unknown event or blank token`() {
        seedEvent(eventId = 1)

        assertIs<EventError.NotFound>(assertIs<Either.Left<*>>(service.validateTicket(99, "tok")).value)
        assertIs<EventError.Validation>(assertIs<Either.Left<*>>(service.validateTicket(1, "  ")).value)
    }

    // ---- validateMemberCredentials ----

    @Test
    fun `member credentials require an active member with matching birth date`() {
        tx.memberRepository.seed(
            testMember(memberId = 20, memberNumber = 1001, birthDate = LocalDate.parse("2000-01-01")),
        )
        tx.memberRepository.seed(
            testMember(memberId = 21, memberNumber = 1002, status = MemberStatus.INATIVO),
        )

        assertTrue(service.validateMemberCredentials(1001, LocalDate.parse("2000-01-01")))
        assertFalse(service.validateMemberCredentials(1001, LocalDate.parse("1999-12-31")))
        assertFalse(service.validateMemberCredentials(1002, LocalDate.parse("2000-01-01")))
        assertFalse(service.validateMemberCredentials(9999, LocalDate.parse("2000-01-01")))
    }

    // ---- startTicketCheckout (caminhos de erro antes do Stripe) ----

    @Test
    fun `checkout rejects events that are cancelled missing or already started`() {
        seedEvent(eventId = 2, status = EventStatus.CANCELLED)
        seedEvent(eventId = 3, startsAt = Clock.System.now() - 1.hours)

        assertIs<EventError.NotFound>(
            assertIs<Either.Left<*>>(service.startTicketCheckout(99, draft(normalLine()), null)).value,
        )
        assertIs<EventError.InvalidOperation>(
            assertIs<Either.Left<*>>(service.startTicketCheckout(2, draft(normalLine()), null)).value,
        )
        assertIs<EventError.InvalidOperation>(
            assertIs<Either.Left<*>>(service.startTicketCheckout(3, draft(normalLine()), null)).value,
        )
    }

    @Test
    fun `checkout requires between one and five tickets`() {
        seedEvent(eventId = 1)
        seedSector()

        assertIs<EventError.Validation>(
            assertIs<Either.Left<*>>(service.startTicketCheckout(1, draft(), null)).value,
        )
        val sixLines = Array(6) { normalLine() }
        assertIs<EventError.Validation>(
            assertIs<Either.Left<*>>(service.startTicketCheckout(1, draft(*sixLines), null)).value,
        )
    }

    @Test
    fun `checkout rejects sectors from another event and sold out sectors`() {
        seedEvent(eventId = 1)
        seedSector(sectorId = 1, capacity = 1, occupied = 1)

        assertIs<EventError.Validation>(
            assertIs<Either.Left<*>>(service.startTicketCheckout(1, draft(normalLine(sectorId = 99)), null)).value,
        )
        val soldOut = assertIs<Either.Left<*>>(service.startTicketCheckout(1, draft(normalLine()), null))
        assertContains(assertIs<EventError.InvalidOperation>(soldOut.value).message, "sold out")
    }

    @Test
    fun `checkout rejects invalid member credentials for anonymous buyers`() {
        seedEvent(eventId = 1)
        seedSector()
        tx.memberRepository.seed(testMember(memberId = 20, memberNumber = 1001, birthDate = LocalDate.parse("2000-01-01")))

        val result = service.startTicketCheckout(1, draft(memberLine(1001, LocalDate.parse("1999-01-01"))), null)

        assertContains(
            assertIs<EventError.InvalidOperation>(assertIs<Either.Left<*>>(result).value).message,
            "invalid or inactive member",
        )
    }

    @Test
    fun `checkout rejects an inactive session member asking for the discount`() {
        seedEvent(eventId = 1)
        seedSector()
        tx.memberRepository.seed(testMember(memberId = 20, status = MemberStatus.INATIVO))
        val auth = testAuth(Role.NORMAL, userId = 5, activeMemberId = 20)
        tx.userRepository.seed(testUser(userId = 5, activeMemberId = 20))

        val result = service.startTicketCheckout(1, draft(memberLine(null, null)), auth)

        assertIs<EventError.InvalidOperation>(assertIs<Either.Left<*>>(result).value)
    }

    @Test
    fun `a member can only hold one member ticket per event`() {
        seedEvent(eventId = 1)
        seedSector(capacity = 10)
        tx.memberRepository.seed(testMember(memberId = 20, memberNumber = 1001, birthDate = LocalDate.parse("2000-01-01")))
        val credentials = memberLine(1001, LocalDate.parse("2000-01-01"))

        val sameCart = service.startTicketCheckout(1, draft(credentials, credentials), null)
        assertContains(
            assertIs<EventError.InvalidOperation>(assertIs<Either.Left<*>>(sameCart).value).message,
            "at most one member ticket",
        )

        seedTicket(ticketId = 30, memberId = 20, status = TicketStatus.CONFIRMED, qrCode = "tok-x")
        val repeat = service.startTicketCheckout(1, draft(credentials), null)
        assertContains(
            assertIs<EventError.InvalidOperation>(assertIs<Either.Left<*>>(repeat).value).message,
            "already has a ticket",
        )
    }

    @Test
    fun `a failed checkout must not leave seats reserved nor a pending charge behind`() {
        seedEvent(eventId = 1)
        seedSector(sectorId = 1, capacity = 5, occupied = 0)
        seedSector(sectorId = 2, capacity = 1, occupied = 1, name = "Esgotado")

        val result = service.startTicketCheckout(1, draft(normalLine(sectorId = 1), normalLine(sectorId = 2)), null)

        assertIs<Either.Left<*>>(result)
        // Either.Left não faz rollback da transacção, por isso nenhuma reserva/escrita pode
        // ficar para trás quando uma linha posterior do carrinho falha.
        assertEquals(
            0,
            tx.eventRepository.sectors
                .getValue(1)
                .occupied,
        )
        assertTrue(tx.chargeRepository.charges.isEmpty())
        assertTrue(tx.ticketRepository.tickets.isEmpty())
    }

    private class NoopEmailSender : EmailSender {
        override fun sendEmail(
            to: String,
            subject: String,
            body: String,
            isHtml: Boolean,
            inlineImages: Map<String, ByteArray>,
            attachments: Map<String, ByteArray>,
        ) = Unit
    }
}
