package pt.isel.jagoz.domain.payment

import kotlinx.datetime.LocalDate
import kotlinx.datetime.LocalDateTime
import org.springframework.stereotype.Component
import pt.isel.jagoz.domain.utils.Either
import pt.isel.jagoz.domain.utils.ValidationError
import pt.isel.jagoz.domain.utils.ValidationUtils
import pt.isel.jagoz.domain.utils.failure
import pt.isel.jagoz.domain.utils.success

/**
 * Errors produced by charge-related domain operations.
 */
sealed class ChargeError {
    data class InvalidOperation(
        val message: String,
    ) : ChargeError()

    data class Validation(
        val message: String,
    ) : ChargeError()

    data class DomainError(
        val message: String,
    ) : ChargeError()
}

/**
 * Errors produced by payment-related domain operations.
 */
sealed class PaymentError {
    data class InvalidOperation(
        val message: String,
    ) : PaymentError()

    data class Validation(
        val message: String,
    ) : PaymentError()

    data class DomainError(
        val message: String,
    ) : PaymentError()
}

/**
 * Domain operations for charges and payments.
 */
@Component
class PaymentDomain {
    /**
     * Validate a [Charge] before creation. Returns [ValidationError] from the
     * shared utils or the charge when validation succeeds.
     */
    fun validateChargeForCreation(charge: Charge): Either<ValidationError, Charge> {
        ValidationUtils.requireCondition(charge.value > 0.0, "value", "must be positive")?.let { return failure(it) }
        ValidationUtils.requireNotBlank(charge.type.name, "type")?.let { return failure(it) }
        // If month provided, must be between 1 and 12
        if (charge.month != null) {
            ValidationUtils.requireCondition(charge.month in 1..12, "month", "must be between 1 and 12")?.let { return failure(it) }
        }
        // season if provided must not be blank
        if (charge.season != null) {
            ValidationUtils.requireNotBlank(charge.season, "season")?.let { return failure(it) }
        }
        return success(charge)
    }

    /**
     * Mark a charge as paid. Only allowed when status is PENDING.
     */
    fun markChargePaid(
        charge: Charge,
        paidAt: LocalDate,
    ): Either<ChargeError, Charge> {
        if (charge.status == ChargeStatus.PAID) return failure(ChargeError.InvalidOperation("already paid"))
        if (charge.status == ChargeStatus.CANCELLED) return failure(ChargeError.InvalidOperation("cancelled charge cannot be paid"))
        if (charge.status != ChargeStatus.PENDING) return failure(ChargeError.InvalidOperation("invalid charge status"))
        return success(charge.copy(status = ChargeStatus.PAID, paidAt = paidAt))
    }

    /**
     * Cancel a charge. Allowed when PENDING. If already paid, returns error.
     */
    fun cancelCharge(charge: Charge): Either<ChargeError, Charge> {
        if (charge.status == ChargeStatus.CANCELLED) return failure(ChargeError.InvalidOperation("already cancelled"))
        if (charge.status == ChargeStatus.PAID) return failure(ChargeError.InvalidOperation("paid charge cannot be cancelled"))
        return success(charge.copy(status = ChargeStatus.CANCELLED))
    }

    /**
     * Validate a payment before persisting. Ensures amount positive and provider present.
     */
    fun validatePaymentForCreation(payment: Payment): Either<ValidationError, Payment> {
        ValidationUtils.requireCondition(payment.amount > 0.0, "amount", "must be positive")?.let { return failure(it) }
        ValidationUtils.requireNotBlank(payment.provider, "provider")?.let { return failure(it) }
        return success(payment)
    }

    /**
     * Mark a payment as confirmed (PAID) and set confirmedAt. Only allowed from PENDING.
     */
    fun confirmPayment(
        payment: Payment,
        confirmedAt: LocalDateTime,
    ): Either<PaymentError, Payment> {
        if (payment.status == PaymentStatus.PAID) return failure(PaymentError.InvalidOperation("already confirmed"))
        if (payment.status != PaymentStatus.PENDING) {
            return failure(
                PaymentError.InvalidOperation("cannot confirm payment in current status"),
            )
        }
        return success(payment.copy(status = PaymentStatus.PAID, confirmedAt = confirmedAt))
    }

    /**
     * Mark a payment as failed.
     */
    fun failPayment(payment: Payment): Either<PaymentError, Payment> {
        if (payment.status == PaymentStatus.PAID) return failure(PaymentError.InvalidOperation("already paid"))
        if (payment.status == PaymentStatus.FAILED) return failure(PaymentError.InvalidOperation("already failed"))
        return success(payment.copy(status = PaymentStatus.FAILED))
    }
}
