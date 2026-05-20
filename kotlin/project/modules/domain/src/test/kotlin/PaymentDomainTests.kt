package pt.isel.jagoz.payment

import kotlinx.datetime.Instant
import kotlinx.datetime.LocalDate
import pt.isel.jagoz.domain.payment.Charge
import pt.isel.jagoz.domain.payment.ChargeError
import pt.isel.jagoz.domain.payment.ChargeStatus
import pt.isel.jagoz.domain.payment.ChargeType
import pt.isel.jagoz.domain.payment.Payment
import pt.isel.jagoz.domain.payment.PaymentDomain
import pt.isel.jagoz.domain.payment.PaymentError
import pt.isel.jagoz.domain.payment.PaymentStatus
import pt.isel.jagoz.domain.user.PasswordValidationInfo
import pt.isel.jagoz.domain.user.Role
import pt.isel.jagoz.domain.user.User
import pt.isel.jagoz.domain.utils.Either
import pt.isel.jagoz.domain.utils.ValidationError
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertIs
import kotlin.test.assertTrue

class PaymentDomainTests {
    private val domain = PaymentDomain()

    private fun normalUser(): User =
        User(
            userId = 1,
            email = "user@example.com",
            username = "Zé Manel",
            passwordValidation = PasswordValidationInfo("hashed"),
            role = Role.NORMAL,
        )

    private fun adminUser(): User =
        User(
            userId = 2,
            email = "admin@example.com",
            username = "Admin",
            passwordValidation = PasswordValidationInfo("hashed"),
            role = Role.ADMIN,
        )

    private fun sampleCharge(status: ChargeStatus = ChargeStatus.PENDING) =
        Charge(
            chargeId = 1,
            type = ChargeType.MEMBER_FEE,
            memberId = 1,
            sponsorshipId = null,
            value = 2000,
            status = status,
            season = "2025/2026",
            month = 5,
            createdAt = LocalDate.parse("2025-05-01"),
            paidAt = null,
            creationUser = normalUser(),
            chargeUser = adminUser(),
        )

    private fun samplePayment(status: PaymentStatus = PaymentStatus.PENDING) =
        Payment(
            paymentId = 1,
            chargeId = 1,
            amount = 2000,
            provider = "stripe",
            providerRef = "sess_123",
            status = status,
            createdAt = Instant.parse("2025-05-01T10:00:00Z"),
            confirmedAt = null,
        )

    // ---- validateChargeForCreation ----

    @Test
    fun `validateChargeForCreation accepts valid charge`() {
        val res = domain.validateChargeForCreation(sampleCharge())
        assertTrue(res is Either.Right)
    }

    @Test
    fun `validateChargeForCreation rejects zero value`() {
        val res = domain.validateChargeForCreation(sampleCharge().copy(value = 0))
        assertTrue(res is Either.Left)
        val err = assertIs<ValidationError.FieldError>(res.value)
        assertEquals("value", err.field)
    }

    @Test
    fun `validateChargeForCreation rejects negative value`() {
        val res = domain.validateChargeForCreation(sampleCharge().copy(value = -1))
        assertTrue(res is Either.Left)
        assertIs<ValidationError.FieldError>(res.value)
    }

    @Test
    fun `validateChargeForCreation rejects month out of range high`() {
        val res = domain.validateChargeForCreation(sampleCharge().copy(month = 13))
        assertTrue(res is Either.Left)
        val err = assertIs<ValidationError.FieldError>(res.value)
        assertEquals("month", err.field)
    }

    @Test
    fun `validateChargeForCreation rejects month out of range low`() {
        val res = domain.validateChargeForCreation(sampleCharge().copy(month = 0))
        assertTrue(res is Either.Left)
        val err = assertIs<ValidationError.FieldError>(res.value)
        assertEquals("month", err.field)
    }

    @Test
    fun `validateChargeForCreation rejects blank season`() {
        val res = domain.validateChargeForCreation(sampleCharge().copy(season = ""))
        assertTrue(res is Either.Left)
        val err = assertIs<ValidationError.FieldError>(res.value)
        assertEquals("season", err.field)
    }

    @Test
    fun `validateChargeForCreation accepts null season and month`() {
        val res = domain.validateChargeForCreation(sampleCharge().copy(season = null, month = null))
        assertTrue(res is Either.Right)
    }

    // ---- markChargePaid ----

    @Test
    fun `markChargePaid transitions PENDING to PAID`() {
        val res = domain.markChargePaid(sampleCharge(), LocalDate.parse("2025-05-02"))
        assertTrue(res is Either.Right)
        assertEquals(ChargeStatus.PAID, res.value.status)
        assertEquals(LocalDate.parse("2025-05-02"), res.value.paidAt)
    }

    @Test
    fun `markChargePaid rejects already PAID`() {
        val res = domain.markChargePaid(sampleCharge(ChargeStatus.PAID), LocalDate.parse("2025-05-02"))
        assertTrue(res is Either.Left)
        assertIs<ChargeError.InvalidOperation>(res.value)
    }

    @Test
    fun `markChargePaid rejects CANCELLED`() {
        val res = domain.markChargePaid(sampleCharge(ChargeStatus.CANCELLED), LocalDate.parse("2025-05-02"))
        assertTrue(res is Either.Left)
        assertIs<ChargeError.InvalidOperation>(res.value)
    }

    // ---- cancelCharge ----

    @Test
    fun `cancelCharge transitions PENDING to CANCELLED`() {
        val res = domain.cancelCharge(sampleCharge())
        assertTrue(res is Either.Right)
        assertEquals(ChargeStatus.CANCELLED, res.value.status)
    }

    @Test
    fun `cancelCharge rejects already CANCELLED`() {
        val res = domain.cancelCharge(sampleCharge(ChargeStatus.CANCELLED))
        assertTrue(res is Either.Left)
        assertIs<ChargeError.InvalidOperation>(res.value)
    }

    @Test
    fun `cancelCharge rejects already PAID`() {
        val res = domain.cancelCharge(sampleCharge(ChargeStatus.PAID))
        assertTrue(res is Either.Left)
        assertIs<ChargeError.InvalidOperation>(res.value)
    }

    // ---- validatePaymentForCreation ----

    @Test
    fun `validatePaymentForCreation accepts valid payment`() {
        val res = domain.validatePaymentForCreation(samplePayment())
        assertTrue(res is Either.Right)
    }

    @Test
    fun `validatePaymentForCreation rejects zero amount`() {
        val res = domain.validatePaymentForCreation(samplePayment().copy(amount = 0))
        assertTrue(res is Either.Left)
        assertIs<ValidationError.FieldError>(res.value)
    }

    @Test
    fun `validatePaymentForCreation rejects blank provider`() {
        val res = domain.validatePaymentForCreation(samplePayment().copy(provider = ""))
        assertTrue(res is Either.Left)
        val err = assertIs<ValidationError.FieldError>(res.value)
        assertEquals("provider", err.field)
    }

    // ---- confirmPayment ----

    @Test
    fun `confirmPayment transitions PENDING to PAID`() {
        val ts = Instant.parse("2025-05-02T12:00:00Z")
        val res = domain.confirmPayment(samplePayment(), ts)
        assertTrue(res is Either.Right)
        assertEquals(PaymentStatus.PAID, res.value.status)
        assertEquals(ts, res.value.confirmedAt)
    }

    @Test
    fun `confirmPayment rejects already PAID`() {
        val res = domain.confirmPayment(samplePayment(PaymentStatus.PAID), Instant.parse("2025-05-02T12:00:00Z"))
        assertTrue(res is Either.Left)
        assertIs<PaymentError.InvalidOperation>(res.value)
    }

    @Test
    fun `confirmPayment rejects FAILED`() {
        val res = domain.confirmPayment(samplePayment(PaymentStatus.FAILED), Instant.parse("2025-05-02T12:00:00Z"))
        assertTrue(res is Either.Left)
        assertIs<PaymentError.InvalidOperation>(res.value)
    }

    // ---- failPayment ----

    @Test
    fun `failPayment transitions PENDING to FAILED`() {
        val res = domain.failPayment(samplePayment())
        assertTrue(res is Either.Right)
        assertEquals(PaymentStatus.FAILED, res.value.status)
    }

    @Test
    fun `failPayment rejects already PAID`() {
        val res = domain.failPayment(samplePayment(PaymentStatus.PAID))
        assertTrue(res is Either.Left)
        assertIs<PaymentError.InvalidOperation>(res.value)
    }

    @Test
    fun `failPayment rejects already FAILED`() {
        val res = domain.failPayment(samplePayment(PaymentStatus.FAILED))
        assertTrue(res is Either.Left)
        assertIs<PaymentError.InvalidOperation>(res.value)
    }
}
