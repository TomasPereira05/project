package pt.isel.jagoz.http

import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestHeader
import org.springframework.web.bind.annotation.RestController
import pt.isel.jagoz.domain.payment.PaymentError
import pt.isel.jagoz.domain.user.AuthenticatedUser
import pt.isel.jagoz.domain.utils.handle
import pt.isel.jagoz.http.model.payment.CreateCheckoutSessionInput
import pt.isel.jagoz.http.model.payment.MarkMembershipFeesPaidInput
import pt.isel.jagoz.http.model.payment.toOutput
import pt.isel.jagoz.http.model.payment.toHtml
import pt.isel.jagoz.http.model.payment.toService
import pt.isel.jagoz.http.utils.Problem
import pt.isel.jagoz.http.utils.Uris
import pt.isel.jagoz.service.PaymentService

@RestController
class PaymentController(
    private val paymentService: PaymentService,
) {
    @PostMapping(Uris.Payments.CREATE_CHECKOUT_SESSION)
    fun createCheckoutSession(
        authenticatedUser: AuthenticatedUser,
        @RequestBody input: CreateCheckoutSessionInput,
    ): ResponseEntity<*> =
        paymentService
            .createCheckoutSession(
                authenticatedUser,
                input.chargeId,
                input.sponsorshipId,
                input.memberId,
                input.membershipFees?.map { it.toService() },
            ).handle(
                onFailure = { handlePaymentError(it) },
                onSuccess = { ResponseEntity.status(HttpStatus.CREATED).body(it.toOutput()) },
            )

    @GetMapping(Uris.Payments.MEMBERSHIP_FEE_OPTIONS)
    fun getMembershipFeeOptions(
        authenticatedUser: AuthenticatedUser,
        @PathVariable memberId: Long,
    ): ResponseEntity<*> =
        paymentService.getMembershipFeeOptions(authenticatedUser, memberId).handle(
            onFailure = { handlePaymentError(it) },
            onSuccess = { options -> ResponseEntity.ok(options.map { it.toOutput() }) },
        )

    @PostMapping(Uris.Payments.MARK_MEMBERSHIP_FEES_PAID)
    fun markMembershipFeesPaid(
        authenticatedUser: AuthenticatedUser,
        @PathVariable memberId: Long,
        @RequestBody input: MarkMembershipFeesPaidInput,
    ): ResponseEntity<*> =
        paymentService.markMembershipFeesPaid(
            authenticatedUser,
            memberId,
            input.membershipFees.map { it.toService() },
        ).handle(
            onFailure = { handlePaymentError(it) },
            onSuccess = { options -> ResponseEntity.ok(options.map { it.toOutput() }) },
        )

    @GetMapping(Uris.Payments.RECEIPT, produces = [MediaType.TEXT_HTML_VALUE])
    fun getReceipt(
        authenticatedUser: AuthenticatedUser,
        @PathVariable paymentId: Long,
    ): ResponseEntity<*> =
        paymentService.getReceipt(authenticatedUser, paymentId).handle(
            onFailure = { handlePaymentError(it) },
            onSuccess = { receipt -> ResponseEntity.ok().contentType(MediaType.TEXT_HTML).body(receipt.toHtml()) },
        )

    @GetMapping(Uris.Payments.SPONSORSHIP_RECEIPT, produces = [MediaType.TEXT_HTML_VALUE])
    fun getSponsorshipReceipt(
        authenticatedUser: AuthenticatedUser,
        @PathVariable sponsorshipId: Long,
    ): ResponseEntity<*> =
        paymentService.getSponsorshipReceipt(authenticatedUser, sponsorshipId).handle(
            onFailure = { handlePaymentError(it) },
            onSuccess = { receipt -> ResponseEntity.ok().contentType(MediaType.TEXT_HTML).body(receipt.toHtml()) },
        )

    @PostMapping(Uris.Payments.STRIPE_WEBHOOK)
    fun handleStripeWebhook(
        @RequestBody payload: String,
        @RequestHeader("Stripe-Signature") signature: String,
    ): ResponseEntity<*> =
        paymentService.handleStripeWebhook(payload, signature).handle(
            onFailure = { handlePaymentError(it) },
            onSuccess = { ResponseEntity.ok().build<Unit>() },
        )

    private fun handlePaymentError(error: PaymentError): ResponseEntity<Any> =
        when (error) {
            is PaymentError.InvalidOperation -> Problem.InvalidOperation("payment", error.message).response(HttpStatus.BAD_REQUEST)
            is PaymentError.Validation -> Problem.ValidationError(error.message).response(HttpStatus.BAD_REQUEST)
            is PaymentError.DomainError ->
                when {
                    error.message.contains("not authorized", ignoreCase = true) ->
                        Problem.Unauthorized(error.message).response(HttpStatus.FORBIDDEN)
                    error.message.contains("not found", ignoreCase = true) ->
                        Problem.ValidationError(error.message).response(HttpStatus.NOT_FOUND)
                    error.message.contains("webhook", ignoreCase = true) ->
                        Problem.ValidationError(error.message).response(HttpStatus.BAD_REQUEST)
                    else -> Problem.ValidationError(error.message).response(HttpStatus.BAD_REQUEST)
                }
        }
}
