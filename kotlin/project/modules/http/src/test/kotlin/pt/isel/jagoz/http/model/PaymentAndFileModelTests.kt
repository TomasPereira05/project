package pt.isel.jagoz.http.model

import kotlinx.datetime.Instant
import kotlinx.datetime.LocalDate
import pt.isel.jagoz.domain.file.FileKind
import pt.isel.jagoz.domain.file.FileOwnerType
import pt.isel.jagoz.domain.file.StoredFile
import pt.isel.jagoz.domain.payment.ChargeStatus
import pt.isel.jagoz.http.model.file.toOutput
import pt.isel.jagoz.http.model.payment.MembershipFeeSelectionInput
import pt.isel.jagoz.http.model.payment.toOutput
import pt.isel.jagoz.http.model.payment.toService
import pt.isel.jagoz.service.CheckoutSessionResult
import pt.isel.jagoz.service.MembershipFeeOption
import kotlin.test.Test
import kotlin.test.assertEquals

class PaymentAndFileModelTests {
    @Test
    fun `membership fee selection input maps to service selection`() {
        val selection = MembershipFeeSelectionInput(season = "2025/2026", month = 9).toService()

        assertEquals("2025/2026", selection.season)
        assertEquals(9, selection.month)
    }

    @Test
    fun `membership fee option maps to output with string due date`() {
        val output =
            MembershipFeeOption(
                season = "2025/2026",
                month = 10,
                amount = 1500,
                dueDate = LocalDate.parse("2025-10-31"),
                status = ChargeStatus.PENDING,
                selectable = true,
                receiptPaymentId = 44,
            ).toOutput()

        assertEquals("2025/2026", output.season)
        assertEquals(10, output.month)
        assertEquals(1500, output.amount)
        assertEquals("2025-10-31", output.dueDate)
        assertEquals(ChargeStatus.PENDING, output.status)
        assertEquals(true, output.selectable)
        assertEquals(44, output.receiptPaymentId)
    }

    @Test
    fun `checkout session result maps to output`() {
        val output =
            CheckoutSessionResult(
                paymentId = 1,
                chargeId = 2,
                sessionId = "cs_test",
                checkoutUrl = "https://checkout.stripe.test/session",
            ).toOutput()

        assertEquals(1, output.paymentId)
        assertEquals(2, output.chargeId)
        assertEquals("cs_test", output.sessionId)
        assertEquals("https://checkout.stripe.test/session", output.checkoutUrl)
    }

    @Test
    fun `stored file maps to output without exposing storage key`() {
        val output =
            StoredFile(
                fileId = 7,
                ownerType = FileOwnerType.ATHLETE,
                ownerId = 5,
                kind = FileKind.ATHLETE_PHOTO,
                originalName = "foto.png",
                contentType = "image/png",
                size = 1234,
                storageKey = "private/key/foto.png",
                uploadedAt = Instant.parse("2026-05-01T10:15:30Z"),
                uploadedBy = 99,
            ).toOutput()

        assertEquals(7, output.fileId)
        assertEquals(FileOwnerType.ATHLETE, output.ownerType)
        assertEquals(FileKind.ATHLETE_PHOTO, output.kind)
        assertEquals("foto.png", output.originalName)
        assertEquals("2026-05-01T10:15:30Z", output.uploadedAt)
        assertEquals(99, output.uploadedBy)
    }
}
