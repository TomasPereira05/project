package pt.isel.jagoz.service

import com.stripe.exception.SignatureVerificationException
import com.google.gson.JsonParser
import com.stripe.model.Event
import com.stripe.model.checkout.Session
import com.stripe.net.RequestOptions
import com.stripe.net.Webhook
import com.stripe.param.checkout.SessionCreateParams
import jakarta.inject.Named
import kotlinx.datetime.Clock
import kotlinx.datetime.TimeZone
import kotlinx.datetime.toLocalDateTime
import pt.isel.jagoz.domain.payment.Charge
import pt.isel.jagoz.domain.payment.ChargeStatus
import pt.isel.jagoz.domain.payment.ChargeType
import pt.isel.jagoz.domain.payment.Payment
import pt.isel.jagoz.domain.payment.PaymentDomain
import pt.isel.jagoz.domain.payment.PaymentError
import pt.isel.jagoz.domain.payment.PaymentStatus
import pt.isel.jagoz.domain.sponsor.Sponsor
import pt.isel.jagoz.domain.sponsor.SponsorDomain
import pt.isel.jagoz.domain.sponsor.SponsorshipStatus
import pt.isel.jagoz.domain.user.AuthenticatedUser
import pt.isel.jagoz.domain.user.canManageBackoffice
import pt.isel.jagoz.domain.utils.Either
import pt.isel.jagoz.domain.utils.ValidationError
import pt.isel.jagoz.domain.utils.failure
import pt.isel.jagoz.domain.utils.success
import pt.isel.jagoz.repository.Transaction
import pt.isel.jagoz.repository.TransactionManager

data class StripeProperties(
    val secretKey: String,
    val webhookSecret: String,
    val apiVersion: String,
    val publicUrl: String,
)

data class CheckoutSessionResult(
    val paymentId: Long,
    val chargeId: Long,
    val sessionId: String,
    val checkoutUrl: String,
)

typealias CheckoutSessionCreationResult = Either<PaymentError, CheckoutSessionResult>
typealias StripeWebhookResult = Either<PaymentError, Unit>

@Named
class PaymentService(
    private val transactionManager: TransactionManager,
    private val paymentDomain: PaymentDomain,
    private val sponsorDomain: SponsorDomain,
    private val stripeProperties: StripeProperties,
) {
    private val requestOptions: RequestOptions =
        RequestOptions
            .builder()
            .setApiKey(stripeProperties.secretKey)
            .build()

    fun createCheckoutSession(
        authenticatedUser: AuthenticatedUser,
        chargeId: Long?,
        sponsorshipId: Long?,
    ): CheckoutSessionCreationResult =
        transactionManager.run { transaction ->
            val charge =
                when {
                    chargeId != null ->
                        transaction.chargeRepository.findById(chargeId)
                            ?: return@run failure(PaymentError.DomainError("Charge $chargeId not found"))

                    sponsorshipId != null ->
                        when (val result = getOrCreateSponsorshipCharge(transaction, authenticatedUser, sponsorshipId)) {
                            is Either.Left -> return@run failure(result.value)
                            is Either.Right -> result.value
                        }

                    else -> return@run failure(PaymentError.Validation("chargeId or sponsorshipId is required"))
                }

            if (!canPayCharge(authenticatedUser, charge)) {
                return@run failure(PaymentError.DomainError("Not authorized"))
            }

            if (charge.status != ChargeStatus.PENDING) {
                return@run failure(PaymentError.InvalidOperation("Charge is not pending"))
            }

            val session = createStripeSession(charge)
            val now = Clock.System.now()
            val payment =
                Payment(
                    paymentId = 0,
                    chargeId = charge.chargeId,
                    amount = charge.value,
                    provider = STRIPE_PROVIDER,
                    providerRef = session.id,
                    status = PaymentStatus.PENDING,
                    createdAt = now,
                    confirmedAt = null,
                )

            when (val validation = paymentDomain.validatePaymentForCreation(payment)) {
                is Either.Left -> failure(PaymentError.Validation(validationErrorMessage(validation.value)))
                is Either.Right -> {
                    val paymentId = transaction.paymentRepository.save(validation.value)
                    success(
                        CheckoutSessionResult(
                            paymentId = paymentId,
                            chargeId = charge.chargeId,
                            sessionId = session.id,
                            checkoutUrl =
                                session.url
                                    ?: return@run failure(PaymentError.DomainError("Stripe did not return a checkout URL")),
                        ),
                    )
                }
            }
        }

    fun handleStripeWebhook(
        payload: String,
        signature: String,
    ): StripeWebhookResult {
        val event =
            try {
                Webhook.constructEvent(payload, signature, stripeProperties.webhookSecret)
            } catch (error: SignatureVerificationException) {
                return failure(PaymentError.DomainError("Invalid Stripe webhook signature"))
            } catch (error: Exception) {
                return failure(PaymentError.DomainError("Invalid Stripe webhook payload"))
            }

        return when (event.type) {
            "checkout.session.completed",
            "checkout.session.async_payment_succeeded",
            -> handleCheckoutSessionPaid(checkoutSessionId(event))

            "checkout.session.async_payment_failed",
            "checkout.session.expired",
            -> handleCheckoutSessionFailed(checkoutSessionId(event))

            else -> success(Unit)
        }
    }

    private fun createStripeSession(charge: Charge): Session {
        val appUrl = stripeProperties.publicUrl.trimEnd('/')
        val params =
            SessionCreateParams
                .builder()
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .setSuccessUrl("$appUrl/payments/success?session_id={CHECKOUT_SESSION_ID}")
                .setCancelUrl("$appUrl/payments/cancel")
                .setCustomerEmail(charge.chargeUser?.email)
                .putMetadata("chargeId", charge.chargeId.toString())
                .putMetadata("chargeType", charge.type.name)
                .addLineItem(
                    SessionCreateParams.LineItem
                        .builder()
                        .setQuantity(1)
                        .setPriceData(
                            SessionCreateParams.LineItem.PriceData
                                .builder()
                                .setCurrency("eur")
                                .setUnitAmount(charge.value.toLong())
                                .setProductData(
                                    SessionCreateParams.LineItem.PriceData.ProductData
                                        .builder()
                                        .setName(chargeProductName(charge))
                                        .build(),
                                ).build(),
                        ).build(),
                ).build()

        return Session.create(params, requestOptions)
    }

    private fun handleCheckoutSessionPaid(sessionId: String?): StripeWebhookResult {
        val stripeSessionId = sessionId ?: return failure(PaymentError.DomainError("Stripe session missing"))
        return transactionManager.run { transaction ->
            val payment =
                transaction.paymentRepository.findByProviderRef(STRIPE_PROVIDER, stripeSessionId)
                    ?: return@run failure(PaymentError.DomainError("Payment for Stripe session $stripeSessionId not found"))

            if (payment.status == PaymentStatus.PAID) {
                return@run success(Unit)
            }

            val charge =
                transaction.chargeRepository.findById(payment.chargeId)
                    ?: return@run failure(PaymentError.DomainError("Charge ${payment.chargeId} not found"))

            val confirmedAt = Clock.System.now()
            when (val confirmedPayment = paymentDomain.confirmPayment(payment, confirmedAt)) {
                is Either.Left -> return@run failure(confirmedPayment.value)
                is Either.Right -> transaction.paymentRepository.update(confirmedPayment.value)
            }

            if (charge.status == ChargeStatus.PENDING) {
                val paidAt = confirmedAt.toLocalDateTime(TimeZone.currentSystemDefault()).date
                when (val paidCharge = paymentDomain.markChargePaid(charge, paidAt)) {
                    is Either.Left -> return@run failure(PaymentError.DomainError(paidCharge.value.toString()))
                    is Either.Right -> transaction.chargeRepository.update(paidCharge.value)
                }
            }

            charge.sponsorshipId?.let { sponsorshipId ->
                val sponsorship =
                    transaction.sponsorshipRepository.findById(sponsorshipId)
                        ?: return@run failure(PaymentError.DomainError("Sponsorship $sponsorshipId not found"))
                if (sponsorship.status != SponsorshipStatus.PAGO) {
                    when (val paidSponsorship = sponsorDomain.markPaid(sponsorship)) {
                        is Either.Left -> return@run failure(PaymentError.DomainError(paidSponsorship.value.toString()))
                        is Either.Right -> transaction.sponsorshipRepository.update(paidSponsorship.value)
                    }
                }
            }

            success(Unit)
        }
    }

    private fun handleCheckoutSessionFailed(sessionId: String?): StripeWebhookResult {
        val stripeSessionId = sessionId ?: return failure(PaymentError.DomainError("Stripe session missing"))
        return transactionManager.run { transaction ->
            val payment =
                transaction.paymentRepository.findByProviderRef(STRIPE_PROVIDER, stripeSessionId)
                    ?: return@run success(Unit)

            if (payment.status == PaymentStatus.PENDING) {
                when (val failed = paymentDomain.failPayment(payment)) {
                    is Either.Left -> return@run failure(failed.value)
                    is Either.Right -> transaction.paymentRepository.update(failed.value)
                }
            }

            success(Unit)
        }
    }

    private fun canPayCharge(
        authenticatedUser: AuthenticatedUser,
        charge: Charge,
    ): Boolean {
        if (authenticatedUser.canManageBackoffice()) {
            return true
        }

        return charge.chargeUser?.userId == authenticatedUser.userId ||
            (charge.memberId != null && charge.memberId == authenticatedUser.activeMemberId)
    }

    private fun getOrCreateSponsorshipCharge(
        transaction: Transaction,
        authenticatedUser: AuthenticatedUser,
        sponsorshipId: Long,
    ): Either<PaymentError, Charge> {
        val sponsorship =
            transaction.sponsorshipRepository.findById(sponsorshipId)
                ?: return failure(PaymentError.DomainError("Sponsorship $sponsorshipId not found"))

        if (sponsorship.status != SponsorshipStatus.APROVADO) {
            return failure(PaymentError.InvalidOperation("Sponsorship must be approved before payment"))
        }

        val sponsor =
            transaction.sponsorRepository.findById(sponsorship.sponsorId)
                ?: return failure(PaymentError.DomainError("Sponsor ${sponsorship.sponsorId} not found"))

        if (!canPaySponsorship(authenticatedUser, sponsor)) {
            return failure(PaymentError.DomainError("Not authorized"))
        }

        transaction.chargeRepository.findPendingBySponsorship(sponsorshipId)?.let { return success(it) }

        val creationUser =
            transaction.userRepository.findById(authenticatedUser.userId)
                ?: return failure(PaymentError.DomainError("User ${authenticatedUser.userId} not found"))
        val chargedUser = sponsor.userId?.let { transaction.userRepository.findById(it) }

        val charge =
            Charge(
                chargeId = 0,
                type = ChargeType.SPONSORSHIP_FEE,
                memberId = null,
                sponsorshipId = sponsorship.sponsorshipId,
                value = sponsorship.price,
                status = ChargeStatus.PENDING,
                season = sponsorship.season,
                month = null,
                createdAt = Clock.System.now().toLocalDateTime(TimeZone.currentSystemDefault()).date,
                creationUser = creationUser,
                chargeUser = chargedUser,
                paidAt = null,
            )

        val chargeId = transaction.chargeRepository.save(charge)
        return success(charge.copy(chargeId = chargeId))
    }

    private fun canPaySponsorship(
        authenticatedUser: AuthenticatedUser,
        sponsor: Sponsor,
    ): Boolean =
        authenticatedUser.canManageBackoffice() ||
            sponsor.userId == authenticatedUser.userId ||
            sponsor.email.equals(authenticatedUser.email, ignoreCase = true)

    private fun chargeProductName(charge: Charge): String =
        when (charge.type) {
            ChargeType.MEMBER_FEE -> "Quota de sócio"
            ChargeType.ATHLETE_MONTHLY_FEE -> "Mensalidade de atleta"
            ChargeType.SPONSORSHIP_FEE -> "Patrocínio"
        }

    private fun checkoutSessionId(event: Event): String? {
        val session = event.dataObjectDeserializer.getObject().orElse(null) as? Session
        if (session?.id != null) return session.id

        return runCatching {
            JsonParser
                .parseString(event.dataObjectDeserializer.getRawJson())
                .asJsonObject
                .get("id")
                ?.asString
        }.getOrNull()
    }

    private fun validationErrorMessage(error: ValidationError): String =
        when (error) {
            is ValidationError.FieldError -> "${error.field} ${error.message}"
            is ValidationError.GlobalError -> error.message
        }

    private companion object {
        const val STRIPE_PROVIDER = "STRIPE"
    }
}
