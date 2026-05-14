package pt.isel.jagoz.domain.event

import kotlinx.datetime.Clock
import kotlinx.datetime.LocalDateTime
import kotlinx.datetime.TimeZone
import kotlinx.datetime.toLocalDateTime
import org.springframework.stereotype.Component
import pt.isel.jagoz.domain.utils.Either
import pt.isel.jagoz.domain.utils.ValidationError
import pt.isel.jagoz.domain.utils.ValidationPatterns
import pt.isel.jagoz.domain.utils.ValidationUtils
import pt.isel.jagoz.domain.utils.failure
import pt.isel.jagoz.domain.utils.success

/**
 * Domain errors for ticket operations.
 */
sealed class TicketError {
    data class InvalidOperation(
        val message: String,
    ) : TicketError()

    data class Validation(
        val message: String,
    ) : TicketError()
}

/**
 * Domain operations related to events and tickets.
 */
@Component
class EventDomain {
    /**
     * Validate an [Event] before creation.
     *
     * - name and location must be non-blank
     * - date must not be in the past
     */
    fun validateEventForCreation(
        event: Event,
        clock: Clock = Clock.System,
    ): Either<ValidationError, Event> {
        ValidationUtils.requireNotBlank(event.name, "name")?.let { return failure(it) }
        ValidationUtils.requireNotBlank(event.location, "location")?.let { return failure(it) }
        val today = clock.now().toLocalDateTime(TimeZone.currentSystemDefault()).date
        ValidationUtils.requireCondition(event.date >= today, "date", "must be today or in the future")?.let { return failure(it) }
        return success(event)
    }

    /**
     * Validate a [Ticket] purchase input.
     * Checks buyer name/email and price.
     */
    fun validateTicketForPurchase(ticket: Ticket): Either<ValidationError, Ticket> {
        ValidationUtils.requireNotBlank(ticket.buyerName, "buyerName")?.let { return failure(it) }
        ValidationUtils.requireNotBlank(ticket.buyerEmail, "buyerEmail")?.let { return failure(it) }
        ValidationUtils
            .requireRegex(
                ticket.buyerEmail,
                ValidationPatterns.EMAIL,
                "buyerEmail",
                "must be a valid email",
            )?.let { return failure(it) }
        ValidationUtils.requireCondition(ticket.price >= 0.0, "price", "must be non-negative")?.let { return failure(it) }
        return success(ticket)
    }

    /**
     * Mark a ticket as used at [usedAt]. Returns error when already used.
     */
    fun markTicketUsed(
        ticket: Ticket,
        usedAt: LocalDateTime,
    ): Either<TicketError, Ticket> {
        if (ticket.used) return failure(TicketError.InvalidOperation("ticket already used"))
        return success(ticket.copy(used = true, usedAt = usedAt))
    }

    /**
     * Validate that a ticket can be refunded (unused). Returns error when already used.
     */
    fun validateRefundable(ticket: Ticket): Either<TicketError, Ticket> {
        if (ticket.used) return failure(TicketError.InvalidOperation("used ticket cannot be refunded"))
        return success(ticket)
    }
}
