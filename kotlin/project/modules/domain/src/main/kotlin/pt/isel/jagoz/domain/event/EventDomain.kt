package pt.isel.jagoz.domain.event

import kotlinx.datetime.Clock
import kotlinx.datetime.LocalDateTime
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
     * Validate the non-temporal fields of an [Event]: name/location non-blank and
     * coherent prices (member price between 0 and the normal price). Reused on update,
     * where the "must be in the future" rule does not apply to past/ongoing events.
     */
    fun validateEventScalars(event: Event): Either<ValidationError, Event> {
        ValidationUtils.requireNotBlank(event.name, "name")?.let { return failure(it) }
        ValidationUtils.requireNotBlank(event.location, "location")?.let { return failure(it) }
        ValidationUtils.requireCondition(event.priceNormal >= 0, "priceNormal", "must be non-negative")?.let { return failure(it) }
        // price_member <= price_normal é intencional (permite preços iguais e eventos gratuitos)
        ValidationUtils
            .requireCondition(
                event.priceMember in 0..event.priceNormal,
                "priceMember",
                "must be between 0 and the normal price",
            )?.let { return failure(it) }
        return success(event)
    }

    /**
     * Full validation for creation: scalar fields plus startsAt in the future.
     */
    fun validateEventForCreation(
        event: Event,
        clock: Clock = Clock.System,
    ): Either<ValidationError, Event> {
        when (val scalars = validateEventScalars(event)) {
            is Either.Left -> return scalars
            is Either.Right -> {}
        }
        ValidationUtils.requireCondition(event.startsAt > clock.now(), "startsAt", "must be in the future")?.let { return failure(it) }
        return success(event)
    }

    /**
     * Validate a [Ticket] purchase input.
     * Checks buyer name/email, price and member consistency.
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
        ValidationUtils.requireCondition(ticket.price >= 0, "price", "must be non-negative")?.let { return failure(it) }
        if (ticket.priceType == TicketPriceType.MEMBER) {
            ValidationUtils
                .requireCondition(
                    ticket.memberId != null,
                    "memberId",
                    "member tickets must reference a member",
                )?.let { return failure(it) }
        }
        return success(ticket)
    }

    /**
     * Mark a ticket as used at [usedAt]. Only confirmed tickets can be used.
     */
    fun markTicketUsed(
        ticket: Ticket,
        usedAt: LocalDateTime,
    ): Either<TicketError, Ticket> {
        if (ticket.status == TicketStatus.USED) return failure(TicketError.InvalidOperation("ticket already used"))
        if (ticket.status != TicketStatus.CONFIRMED) {
            return failure(TicketError.InvalidOperation("only confirmed tickets can be used"))
        }
        return success(ticket.copy(status = TicketStatus.USED, usedAt = usedAt))
    }

    /**
     * Validate that a ticket can be refunded (not used). Returns error when already used.
     */
    fun validateRefundable(ticket: Ticket): Either<TicketError, Ticket> {
        if (ticket.status == TicketStatus.USED) return failure(TicketError.InvalidOperation("used ticket cannot be refunded"))
        return success(ticket)
    }
}
