package pt.isel.jagoz.service

import kotlinx.datetime.Clock
import kotlinx.datetime.Instant
import kotlinx.datetime.LocalDate
import kotlinx.datetime.TimeZone
import kotlinx.datetime.toLocalDateTime
import pt.isel.jagoz.domain.event.Event
import pt.isel.jagoz.domain.event.EventSector
import pt.isel.jagoz.domain.event.Ticket
import pt.isel.jagoz.domain.event.TicketPriceType
import pt.isel.jagoz.domain.event.TicketStatus
import pt.isel.jagoz.domain.member.MemberStatus
import pt.isel.jagoz.domain.payment.Charge
import pt.isel.jagoz.domain.payment.ChargeItem
import pt.isel.jagoz.domain.payment.ChargeStatus
import pt.isel.jagoz.domain.payment.ChargeType
import pt.isel.jagoz.domain.payment.Payment
import pt.isel.jagoz.domain.payment.PaymentDomain
import pt.isel.jagoz.domain.payment.PaymentError
import pt.isel.jagoz.domain.payment.PaymentStatus
import pt.isel.jagoz.domain.sponsor.SponsorDomain
import pt.isel.jagoz.domain.user.Role
import pt.isel.jagoz.domain.utils.Either
import pt.isel.jagoz.service.email.EmailSender
import pt.isel.jagoz.service.email.EmailService
import pt.isel.jagoz.service.pdf.PdfGenerator
import pt.isel.jagoz.service.qr.QrCodeGenerator
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec
import kotlin.test.Test
import kotlin.test.assertContains
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertIs
import kotlin.test.assertNotEquals
import kotlin.test.assertNotNull
import kotlin.test.assertTrue

class PaymentServiceTests {
    private val txManager = FakeTransactionManager()
    private val tx = txManager.tx
    private val emailSender = FakeEmailSender()
    private val service =
        PaymentService(
            txManager,
            PaymentDomain(),
            SponsorDomain(),
            StripeProperties(
                secretKey = "sk_test_dummy",
                webhookSecret = WEBHOOK_SECRET,
                apiVersion = "2023-10-16",
                publicUrl = "http://localhost:8080",
            ),
            EmailService(emailSender, QrCodeGenerator(), PdfGenerator()),
        )

    private val admin = testAuth(Role.ADMIN, userId = 1)
    private val owner = testAuth(Role.NORMAL, userId = 5, activeMemberId = 20)
    private val stranger = testAuth(Role.NORMAL, userId = 6)

    init {
        tx.userRepository.seed(testUser(userId = 1, role = Role.ADMIN))
        tx.userRepository.seed(testUser(userId = 5, activeMemberId = 20))
        tx.userRepository.seed(testUser(userId = 6))
    }

    private fun seedCharge(
        chargeId: Long = 100,
        type: ChargeType = ChargeType.MEMBER_FEE,
        memberId: Long? = 20,
        status: ChargeStatus = ChargeStatus.PENDING,
        value: Int = 200,
    ) = tx.chargeRepository.seed(
        Charge(
            chargeId = chargeId,
            type = type,
            memberId = memberId,
            sponsorshipId = null,
            value = value,
            status = status,
            season = "2025/2026",
            month = 5,
            createdAt = LocalDate.parse("2026-05-01"),
            creationUser = null,
            chargeUser = null,
            paidAt = if (status == ChargeStatus.PAID) LocalDate.parse("2026-05-02") else null,
        ),
    )

    private fun seedStripePayment(
        chargeId: Long,
        sessionId: String,
        status: PaymentStatus = PaymentStatus.PENDING,
    ) = tx.paymentRepository.seed(
        Payment(
            paymentId = 0,
            chargeId = chargeId,
            amount = 200,
            provider = "STRIPE",
            providerRef = sessionId,
            status = status,
            createdAt = Instant.parse("2026-05-01T10:00:00Z"),
            confirmedAt = if (status == PaymentStatus.PAID) Instant.parse("2026-05-01T11:00:00Z") else null,
        ).let { it.copy(paymentId = 500L + tx.paymentRepository.payments.size) },
    )

    // ---- webhook Stripe ----

    @Test
    fun `webhook rejects an invalid signature`() {
        val payload = sessionEventPayload("checkout.session.completed", "cs_1")

        val result = service.handleStripeWebhook(payload, "t=123,v1=deadbeef")

        val error = assertIs<PaymentError.DomainError>(assertIs<Either.Left<*>>(result).value)
        assertContains(error.message, "signature")
    }

    @Test
    fun `webhook confirms the payment and marks the charge paid`() {
        seedCharge(chargeId = 100)
        seedStripePayment(chargeId = 100, sessionId = "cs_1")

        val payload = sessionEventPayload("checkout.session.completed", "cs_1")
        val result = service.handleStripeWebhook(payload, sign(payload))

        assertIs<Either.Right<*>>(result)
        val payment =
            tx.paymentRepository.payments.values
                .single()
        assertEquals(PaymentStatus.PAID, payment.status)
        assertNotNull(payment.confirmedAt)
        val charge = tx.chargeRepository.charges.getValue(100)
        assertEquals(ChargeStatus.PAID, charge.status)
        assertNotNull(charge.paidAt)
    }

    @Test
    fun `duplicate webhook is a no-op`() {
        seedCharge(chargeId = 100)
        seedStripePayment(chargeId = 100, sessionId = "cs_1")
        val payload = sessionEventPayload("checkout.session.completed", "cs_1")
        service.handleStripeWebhook(payload, sign(payload))
        val updatesAfterFirst = tx.paymentRepository.updates.size
        val confirmedAt =
            tx.paymentRepository.payments.values
                .single()
                .confirmedAt

        val result = service.handleStripeWebhook(payload, sign(payload))

        assertIs<Either.Right<*>>(result)
        assertEquals(updatesAfterFirst, tx.paymentRepository.updates.size)
        assertEquals(
            confirmedAt,
            tx.paymentRepository.payments.values
                .single()
                .confirmedAt,
        )
    }

    @Test
    fun `webhook for a second payment attempt does not re-pay an already paid charge`() {
        seedCharge(chargeId = 100, status = ChargeStatus.PAID)
        seedStripePayment(chargeId = 100, sessionId = "cs_2")

        val payload = sessionEventPayload("checkout.session.completed", "cs_2")
        val result = service.handleStripeWebhook(payload, sign(payload))

        assertIs<Either.Right<*>>(result)
        assertEquals(
            PaymentStatus.PAID,
            tx.paymentRepository.payments.values
                .single()
                .status,
        )
        assertTrue(tx.chargeRepository.updates.isEmpty())
    }

    @Test
    fun `webhook for an unknown session fails without touching state`() {
        val payload = sessionEventPayload("checkout.session.completed", "cs_missing")

        val result = service.handleStripeWebhook(payload, sign(payload))

        assertIs<PaymentError.DomainError>(assertIs<Either.Left<*>>(result).value)
    }

    @Test
    fun `webhook ignores unrelated event types`() {
        val payload = sessionEventPayload("invoice.paid", "cs_1")

        assertIs<Either.Right<*>>(service.handleStripeWebhook(payload, sign(payload)))
    }

    @Test
    fun `webhook confirms reserved tickets with unique qr tokens and emails the buyer`() {
        val event =
            tx.eventRepository.seed(
                Event(1, "Jogo Grande", "desc", Clock.System.now(), "Estádio", 1000, 500),
            )
        tx.eventRepository.seedSector(EventSector(1, event.eventId, "Bancada", 100, 2))
        seedCharge(chargeId = 100, type = ChargeType.TICKET_PURCHASE, memberId = null, value = 2000)
        tx.ticketRepository.seed(ticket(ticketId = 11, chargeId = 100))
        tx.ticketRepository.seed(ticket(ticketId = 12, chargeId = 100))
        seedStripePayment(chargeId = 100, sessionId = "cs_t")

        val payload = sessionEventPayload("checkout.session.completed", "cs_t")
        val result = service.handleStripeWebhook(payload, sign(payload))

        assertIs<Either.Right<*>>(result)
        val tickets =
            tx.ticketRepository.tickets.values
                .sortedBy { it.ticketId }
        assertTrue(tickets.all { it.status == TicketStatus.CONFIRMED })
        assertTrue(tickets.all { it.qrCode != null })
        assertNotEquals(tickets[0].qrCode, tickets[1].qrCode)
        val email = emailSender.sent.single()
        assertEquals("buyer@example.test", email.to)
        assertContains(email.subject, "Jogo Grande")
    }

    @Test
    fun `failed webhook fails the payment and cancels reserved tickets releasing the seats`() {
        val event = tx.eventRepository.seed(Event(1, "Jogo", "desc", Clock.System.now(), "Estádio", 1000, 500))
        tx.eventRepository.seedSector(EventSector(1, event.eventId, "Bancada", 100, 2))
        seedCharge(chargeId = 100, type = ChargeType.TICKET_PURCHASE, memberId = null)
        tx.ticketRepository.seed(ticket(ticketId = 11, chargeId = 100))
        tx.ticketRepository.seed(ticket(ticketId = 12, chargeId = 100))
        seedStripePayment(chargeId = 100, sessionId = "cs_f")

        val payload = sessionEventPayload("checkout.session.expired", "cs_f")
        val result = service.handleStripeWebhook(payload, sign(payload))

        assertIs<Either.Right<*>>(result)
        assertEquals(
            PaymentStatus.FAILED,
            tx.paymentRepository.payments.values
                .single()
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
    fun `failed webhook for an unknown session is a no-op`() {
        val payload = sessionEventPayload("checkout.session.expired", "cs_missing")

        assertIs<Either.Right<*>>(service.handleStripeWebhook(payload, sign(payload)))
    }

    private fun ticket(
        ticketId: Long,
        chargeId: Long,
    ) = Ticket(
        ticketId = ticketId,
        eventId = 1,
        sectorId = 1,
        chargeId = chargeId,
        priceType = TicketPriceType.NORMAL,
        price = 1000,
        buyerEmail = "buyer@example.test",
        buyerName = "Buyer",
        status = TicketStatus.RESERVED,
    )

    // ---- createCheckoutSession (caminhos que falham antes do Stripe) ----

    @Test
    fun `createCheckoutSession requires a charge sponsorship or member`() {
        val result = service.createCheckoutSession(admin, null, null, null, null)

        assertIs<PaymentError.Validation>(assertIs<Either.Left<*>>(result).value)
    }

    @Test
    fun `createCheckoutSession denies a user paying an unrelated charge`() {
        seedCharge(chargeId = 100, memberId = 20)

        val result = service.createCheckoutSession(stranger, 100, null, null, null)

        val error = assertIs<PaymentError.DomainError>(assertIs<Either.Left<*>>(result).value)
        assertContains(error.message, "Not authorized")
    }

    @Test
    fun `createCheckoutSession rejects a charge that is not pending`() {
        seedCharge(chargeId = 100, status = ChargeStatus.PAID)

        val result = service.createCheckoutSession(admin, 100, null, null, null)

        assertIs<PaymentError.InvalidOperation>(assertIs<Either.Left<*>>(result).value)
    }

    // ---- markMembershipFeesPaid (fluxo manual da secretaria) ----

    @Test
    fun `markMembershipFeesPaid requires backoffice role`() {
        val result = service.markMembershipFeesPaid(owner, 20, listOf(MembershipFeeSelection("2025/2026", 5)))

        assertIs<PaymentError.DomainError>(assertIs<Either.Left<*>>(result).value)
    }

    @Test
    fun `markMembershipFeesPaid creates a paid charge with items and a manual payment`() {
        tx.memberRepository.seed(testMember(memberId = 20))

        val result =
            service.markMembershipFeesPaid(
                admin,
                20,
                listOf(MembershipFeeSelection("2025/2026", 5), MembershipFeeSelection("2025/2026", 6)),
            )

        assertIs<Either.Right<*>>(result)
        val charge =
            tx.chargeRepository.charges.values
                .single()
        assertEquals(ChargeStatus.PAID, charge.status)
        assertEquals(400, charge.value)
        val items =
            tx.chargeItemRepository.items.values
                .sortedBy { it.month }
        assertEquals(listOf(5, 6), items.map { it.month })
        assertEquals("Quota Maio 2025/2026", items.first().description)
        val payment =
            tx.paymentRepository.payments.values
                .single()
        assertEquals("MANUAL", payment.provider)
        assertEquals(PaymentStatus.PAID, payment.status)
        assertEquals(charge.value, payment.amount)
    }

    @Test
    fun `a membership fee cannot be paid twice`() {
        tx.memberRepository.seed(testMember(memberId = 20))
        service.markMembershipFeesPaid(admin, 20, listOf(MembershipFeeSelection("2025/2026", 5)))

        val result = service.markMembershipFeesPaid(admin, 20, listOf(MembershipFeeSelection("2025/2026", 5)))

        val error = assertIs<PaymentError.InvalidOperation>(assertIs<Either.Left<*>>(result).value)
        assertContains(error.message, "already paid")
    }

    @Test
    fun `markMembershipFeesPaid validates selections member state and quota`() {
        tx.memberRepository.seed(testMember(memberId = 20))
        tx.memberRepository.seed(testMember(memberId = 21, status = MemberStatus.PENDENTE))
        tx.memberRepository.seed(testMember(memberId = 22, membershipQuota = 0))

        assertIs<PaymentError.Validation>(
            assertIs<Either.Left<*>>(service.markMembershipFeesPaid(admin, 20, emptyList())).value,
        )
        assertIs<PaymentError.Validation>(
            assertIs<Either.Left<*>>(
                service.markMembershipFeesPaid(admin, 20, listOf(MembershipFeeSelection("2025/2026", 13))),
            ).value,
        )
        assertIs<PaymentError.InvalidOperation>(
            assertIs<Either.Left<*>>(
                service.markMembershipFeesPaid(admin, 21, listOf(MembershipFeeSelection("2025/2026", 5))),
            ).value,
        )
        assertIs<PaymentError.InvalidOperation>(
            assertIs<Either.Left<*>>(
                service.markMembershipFeesPaid(admin, 22, listOf(MembershipFeeSelection("2025/2026", 5))),
            ).value,
        )
    }

    @Test
    fun `fees inside a pending charge must be selected exactly as a whole`() {
        tx.memberRepository.seed(testMember(memberId = 20))
        val pending = seedCharge(chargeId = 100, status = ChargeStatus.PENDING)
        tx.chargeItemRepository.save(ChargeItem(0, pending.chargeId, "2025/2026", 5, 200, "Quota Maio 2025/2026"))
        tx.chargeItemRepository.save(ChargeItem(0, pending.chargeId, "2025/2026", 6, 200, "Quota Junho 2025/2026"))

        val partial = service.markMembershipFeesPaid(admin, 20, listOf(MembershipFeeSelection("2025/2026", 5)))
        assertIs<PaymentError.InvalidOperation>(assertIs<Either.Left<*>>(partial).value)

        val whole =
            service.markMembershipFeesPaid(
                admin,
                20,
                listOf(MembershipFeeSelection("2025/2026", 5), MembershipFeeSelection("2025/2026", 6)),
            )
        assertIs<Either.Right<*>>(whole)
        assertEquals(
            ChargeStatus.PAID,
            tx.chargeRepository.charges
                .getValue(100)
                .status,
        )
        assertEquals(1, tx.chargeRepository.charges.size)
    }

    // ---- getMembershipFeeOptions / isMembershipFeeOverdue ----

    @Test
    fun `fee options are visible to the owner and staff but not to unrelated users`() {
        tx.memberRepository.seed(testMember(memberId = 20))

        assertIs<Either.Right<*>>(service.getMembershipFeeOptions(owner, 20))
        assertIs<Either.Right<*>>(service.getMembershipFeeOptions(admin, 20))
        assertIs<PaymentError.DomainError>(assertIs<Either.Left<*>>(service.getMembershipFeeOptions(stranger, 20)).value)
    }

    @Test
    fun `a guardian managing the athlete can see the athlete fee options`() {
        tx.memberRepository.seed(testMember(memberId = 30))
        tx.athleteRepository.seed(testAthlete(athleteId = 7, memberId = 30))
        tx.athleteRepository.linkUserToAthlete(stranger.userId, 7)

        assertIs<Either.Right<*>>(service.getMembershipFeeOptions(stranger, 30))
    }

    @Test
    fun `unpaid months in the catalog have null status and stay selectable`() {
        tx.memberRepository.seed(testMember(memberId = 20))

        val result = service.getMembershipFeeOptions(admin, 20)

        val options = assertIs<Either.Right<List<MembershipFeeOption>>>(result).value
        assertTrue(options.isNotEmpty())
        assertTrue(options.all { it.status == null && it.selectable })
    }

    @Test
    fun `fee options are empty for inactive members`() {
        tx.memberRepository.seed(testMember(memberId = 20, status = MemberStatus.INATIVO))

        val options = assertIs<Either.Right<List<MembershipFeeOption>>>(service.getMembershipFeeOptions(admin, 20)).value

        assertTrue(options.isEmpty())
    }

    @Test
    fun `member with an unpaid previous month is overdue`() {
        val today =
            Clock.System
                .now()
                .toLocalDateTime(TimeZone.currentSystemDefault())
                .date
        val approval = LocalDate(today.year, today.monthNumber, 1).minusMonths(2)
        tx.memberRepository.seed(testMember(memberId = 20, registrationDate = approval, approvalDate = approval))

        assertTrue(service.isMembershipFeeOverdue(20))
    }

    @Test
    fun `member approved in the current month is not overdue`() {
        val today =
            Clock.System
                .now()
                .toLocalDateTime(TimeZone.currentSystemDefault())
                .date
        val approval = LocalDate(today.year, today.monthNumber, 1)
        tx.memberRepository.seed(testMember(memberId = 20, registrationDate = approval, approvalDate = approval))

        assertFalse(service.isMembershipFeeOverdue(20))
    }

    @Test
    fun `member with all previous months paid is not overdue`() {
        val today =
            Clock.System
                .now()
                .toLocalDateTime(TimeZone.currentSystemDefault())
                .date
        val approval = LocalDate(today.year, today.monthNumber, 1).minusMonths(1)
        tx.memberRepository.seed(testMember(memberId = 20, registrationDate = approval, approvalDate = approval))
        val paid = seedCharge(chargeId = 100, status = ChargeStatus.PAID)
        tx.chargeItemRepository.save(
            ChargeItem(0, paid.chargeId, seasonOf(approval), approval.monthNumber, 200, "Quota"),
        )

        assertFalse(service.isMembershipFeeOverdue(20))
    }

    @Test
    fun `inactive members are never overdue`() {
        tx.memberRepository.seed(testMember(memberId = 20, status = MemberStatus.INATIVO))

        assertFalse(service.isMembershipFeeOverdue(20))
    }

    // ---- getReceipt ----

    @Test
    fun `receipt is only available for paid payments`() {
        seedCharge(chargeId = 100)
        val payment = seedStripePayment(chargeId = 100, sessionId = "cs_1", status = PaymentStatus.PENDING)

        val result = service.getReceipt(admin, payment.paymentId)

        assertIs<PaymentError.InvalidOperation>(assertIs<Either.Left<*>>(result).value)
    }

    @Test
    fun `receipt carries the member identification and the item lines`() {
        tx.memberRepository.seed(testMember(memberId = 20))
        val charge = seedCharge(chargeId = 100, status = ChargeStatus.PAID)
        tx.chargeItemRepository.save(ChargeItem(0, charge.chargeId, "2025/2026", 5, 200, "Quota Maio 2025/2026"))
        val payment = seedStripePayment(chargeId = 100, sessionId = "cs_1", status = PaymentStatus.PAID)

        val result = service.getReceipt(owner, payment.paymentId)

        val receipt = assertIs<Either.Right<PaymentReceipt>>(result).value
        assertEquals("Member 20", receipt.payerName)
        assertEquals(
            tx.memberRepository.members
                .getValue(20)
                .nif,
            receipt.payerNif,
        )
        assertEquals(listOf(ReceiptLine("Quota Maio 2025/2026", 200)), receipt.lines)
        assertEquals("2026/${payment.paymentId}", receipt.receiptNumber)
    }

    @Test
    fun `receipt of another member is not visible to an unrelated user`() {
        tx.memberRepository.seed(testMember(memberId = 20))
        seedCharge(chargeId = 100, status = ChargeStatus.PAID)
        val payment = seedStripePayment(chargeId = 100, sessionId = "cs_1", status = PaymentStatus.PAID)

        val result = service.getReceipt(stranger, payment.paymentId)

        assertIs<PaymentError.DomainError>(assertIs<Either.Left<*>>(result).value)
    }

    // ---- helpers ----

    private fun sessionEventPayload(
        type: String,
        sessionId: String,
    ): String =
        """
        {"id":"evt_1","object":"event","api_version":"2023-10-16","type":"$type",
         "data":{"object":{"id":"$sessionId","object":"checkout.session"}}}
        """.trimIndent()

    private fun sign(payload: String): String {
        val timestamp = System.currentTimeMillis() / 1000
        val mac = Mac.getInstance("HmacSHA256")
        mac.init(SecretKeySpec(WEBHOOK_SECRET.toByteArray(Charsets.UTF_8), "HmacSHA256"))
        val signature =
            mac
                .doFinal("$timestamp.$payload".toByteArray(Charsets.UTF_8))
                .joinToString("") { "%02x".format(it) }
        return "t=$timestamp,v1=$signature"
    }

    private fun seasonOf(date: LocalDate): String =
        if (date.monthNumber >= 8) "${date.year}/${date.year + 1}" else "${date.year - 1}/${date.year}"

    private fun LocalDate.minusMonths(months: Int): LocalDate {
        val zeroBased = year * 12 + (monthNumber - 1) - months
        return LocalDate(zeroBased / 12, zeroBased % 12 + 1, 1)
    }

    private class FakeEmailSender : EmailSender {
        data class Sent(
            val to: String,
            val subject: String,
        )

        val sent = mutableListOf<Sent>()

        override fun sendEmail(
            to: String,
            subject: String,
            body: String,
            isHtml: Boolean,
            inlineImages: Map<String, ByteArray>,
            attachments: Map<String, ByteArray>,
        ) {
            sent += Sent(to, subject)
        }
    }

    private companion object {
        const val WEBHOOK_SECRET = "whsec_test_secret"
    }
}
