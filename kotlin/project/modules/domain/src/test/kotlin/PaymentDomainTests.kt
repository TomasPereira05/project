package pt.isel

import kotlinx.datetime.LocalDate
import kotlinx.datetime.LocalDateTime
import pt.isel.payment.Charge
import pt.isel.payment.ChargeStatus
import pt.isel.payment.ChargeType
import pt.isel.payment.Payment
import pt.isel.payment.PaymentDomain
import pt.isel.payment.PaymentStatus
import pt.isel.utils.Either
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class PaymentDomainTests {
    private val domain = PaymentDomain()

    private fun sampleCharge(status: ChargeStatus = ChargeStatus.PENDING) =
        Charge(
            chargeId = 1,
            type = ChargeType.MEMBER_FEE,
            memberId = 1,
            sponsorshipId = null,
            value = 20.0,
            status = status,
            season = "2025/2026",
            month = 5,
            createdAt = LocalDate.parse("2025-05-01"),
            paidAt = null,
        )

    private fun samplePayment(status: PaymentStatus = PaymentStatus.PENDING) =
        Payment(
            paymentId = 1,
            chargeId = 1,
            amount = 20.0,
            provider = "stripe",
            providerRef = "sess_123",
            status = status,
            createdAt = LocalDateTime.parse("2025-05-01T10:00:00"),
            confirmedAt = null,
        )

    @Test
    fun validateCharge_success_and_failures() {
        val c = sampleCharge()
        val ok = domain.validateChargeForCreation(c)
        assertTrue(ok is Either.Right)

        val bad = c.copy(value = 0.0)
        val r = domain.validateChargeForCreation(bad)
        assertTrue(r is Either.Left)
    }

    @Test
    fun markChargePaid_and_cancel_behaviour() {
        val c = sampleCharge()
        val paid = domain.markChargePaid(c, LocalDate.parse("2025-05-02"))
        assertTrue(paid is Either.Right)
        assertEquals(ChargeStatus.PAID, paid.value.status)

        val cancel = domain.cancelCharge(c)
        assertTrue(cancel is Either.Right)
        assertEquals(ChargeStatus.CANCELLED, cancel.value.status)
    }

    @Test
    fun validatePayment_and_confirm_and_fail() {
        val p = samplePayment()
        val ok = domain.validatePaymentForCreation(p)
        assertTrue(ok is Either.Right)

        val confirmed = domain.confirmPayment(p, LocalDateTime.parse("2025-05-02T12:00:00"))
        assertTrue(confirmed is Either.Right)
        assertEquals(PaymentStatus.PAID, confirmed.value.status)

        val fail = domain.failPayment(p)
        assertTrue(fail is Either.Right)
        assertEquals(PaymentStatus.FAILED, fail.value.status)
    }
}
