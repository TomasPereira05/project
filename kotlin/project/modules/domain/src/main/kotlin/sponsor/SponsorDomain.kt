package pt.isel.sponsor

import pt.isel.utils.failure
import pt.isel.utils.success
import pt.isel.utils.Either

/**
 * Errors produced by sponsor domain operations.
 */
sealed class SponsorError {
    /**
     * Operation not allowed in the current sponsorship status.
     * @param from the current [SponsorshipStatus]
     * @param attempted a short description of the attempted operation
     */
    data class InvalidTransition(val from: SponsorshipStatus, val attempted: String) : SponsorError()

    /**
     * Validation failure (e.g. invalid input).
     * @param message human-readable message describing the validation problem
     */
    data class ValidationError(val message: String) : SponsorError()

    /**
     * Generic domain error.
     * @param message description of the domain error
     */
    data class DomainError(val message: String) : SponsorError()
}

/**
 * Domain functions to operate on `Sponsor` and `Sponsorship` entities.
 * Pure functions that return [Either] with [SponsorError] on failure.
 */
object SponsorDomain {

    /**
     * Update sponsor contact information.
     *
     * Preconditions:
     * - [name] must not be blank.
     * - [email] must contain an '@' character.
     * - [phone] and [nif] must not be blank.
     *
     * Postconditions:
     * - Returns a copy of [sponsor] with updated contact fields.
     *
     * Errors:
     * - Returns [SponsorError.ValidationError] for invalid inputs.
     *
     * @param sponsor the sponsor to update
     * @param name new display name
     * @param email new email address
     * @param phone new phone number
     * @param nif new tax identification number
     * @return Either a [SponsorError] or the updated [Sponsor]
     */
    fun updateContact(sponsor: Sponsor, name: String, email: String, phone: String, nif: String): Either<SponsorError, Sponsor> {
        if (name.isBlank()) return failure(SponsorError.ValidationError("name cannot be blank"))
        if (email.isBlank() || !email.contains("@")) return failure(SponsorError.ValidationError("invalid email"))
        if (phone.isBlank()) return failure(SponsorError.ValidationError("phone cannot be empty"))
        if (nif.isBlank()) return failure(SponsorError.ValidationError("nif cannot be empty"))
        return success(sponsor.copy(name = name, email = email, phone = phone, nif = nif))
    }

    /**
     * Approve a sponsorship that is currently submitted.
     *
     * Preconditions:
     * - sponsorship status must be [SponsorshipStatus.SUBMETIDO].
     *
     * Postconditions:
     * - Returns a copy of the sponsorship with status [SponsorshipStatus.APROVADO].
     *
     * Errors:
     * - Returns [SponsorError.InvalidTransition] if the sponsorship is not SUBMETIDO.
     *
     * @param s the sponsorship to approve
     * @return Either a [SponsorError] or the approved [Sponsorship]
     */
    fun approve(s: Sponsorship): Either<SponsorError, Sponsorship> {
        if (s.status != SponsorshipStatus.SUBMETIDO) return failure(SponsorError.InvalidTransition(s.status, "approve"))
        return success(s.copy(status = SponsorshipStatus.APROVADO))
    }

    /**
     * Mark a sponsorship as paid.
     *
     * Preconditions:
     * - sponsorship status must be [SponsorshipStatus.APROVADO].
     *
     * Postconditions:
     * - Returns a copy of the sponsorship with status [SponsorshipStatus.PAGO].
     *
     * Errors:
     * - Returns [SponsorError.InvalidTransition] if the sponsorship is not APROVADO.
     *
     * @param s the sponsorship to mark as paid
     * @return Either a [SponsorError] or the updated [Sponsorship]
     */
    fun markPaid(s: Sponsorship): Either<SponsorError, Sponsorship> {
        if (s.status != SponsorshipStatus.APROVADO) return failure(SponsorError.InvalidTransition(s.status, "markPaid"))
        return success(s.copy(status = SponsorshipStatus.PAGO))
    }

    /**
     * Activate a sponsorship (make it effective).
     *
     * Preconditions:
     * - sponsorship status must be [SponsorshipStatus.PAGO].
     *
     * Postconditions:
     * - Returns a copy of the sponsorship with status [SponsorshipStatus.ATIVO].
     *
     * Errors:
     * - Returns [SponsorError.InvalidTransition] if the sponsorship is not PAGO.
     *
     * @param s the sponsorship to activate
     * @return Either a [SponsorError] or the activated [Sponsorship]
     */
    fun activate(s: Sponsorship): Either<SponsorError, Sponsorship> {
        if (s.status != SponsorshipStatus.PAGO) return failure(SponsorError.InvalidTransition(s.status, "activate"))
        return success(s.copy(status = SponsorshipStatus.ATIVO))
    }

    /**
     * Cancel a sponsorship.
     *
     * Preconditions:
     * - sponsorship status must not be [SponsorshipStatus.CANCELADO].
     *
     * Postconditions:
     * - Returns a copy of the sponsorship with status [SponsorshipStatus.CANCELADO].
     *
     * Errors:
     * - Returns [SponsorError.DomainError] when the sponsorship is already cancelled.
     *
     * @param s the sponsorship to cancel
     * @return Either a [SponsorError] or the cancelled [Sponsorship]
     */
    fun cancel(s: Sponsorship): Either<SponsorError, Sponsorship> {
        if (s.status == SponsorshipStatus.CANCELADO) return failure(SponsorError.DomainError("already cancelled"))
        return success(s.copy(status = SponsorshipStatus.CANCELADO))
    }

    /**
     * Change the equipment placement for a TEAM sponsorship.
     *
     * Preconditions:
     * - sponsorship type must be [SponsorType.TEAM].
     * - sponsorship status must not be [SponsorshipStatus.CANCELADO].
     *
     * Postconditions:
     * - Returns a copy of the sponsorship with [placement] set to [newPlacement].
     *
     * Errors:
     * - Returns [SponsorError.ValidationError] when the sponsorship is not TEAM.
     * - Returns [SponsorError.InvalidTransition] when sponsorship is CANCELADO.
     *
     * @param s the sponsorship to modify
     * @param newPlacement the new equipment placement
     * @return Either a [SponsorError] or the updated [Sponsorship]
     */
    fun changePlacement(s: Sponsorship, newPlacement: EquipmentPlacement): Either<SponsorError, Sponsorship> {
        if (s.type != SponsorType.TEAM) return failure(SponsorError.ValidationError("placement only valid for TEAM sponsorships"))
        if (s.status == SponsorshipStatus.CANCELADO) return failure(SponsorError.InvalidTransition(s.status, "changePlacement"))
        return success(s.copy(placement = newPlacement))
    }

    /**
     * Validate a sponsorship before persisting or processing it.
     *
     * Checks performed:
     * - season is not blank
     * - price is not negative
     * - required fields for the specific sponsorship type are present
     *
     * Errors:
     * - Returns [SponsorError.ValidationError] when a check fails.
     *
     * @param s the sponsorship to validate
     * @return Either a [SponsorError] or the validated [Sponsorship]
     */
    fun validateForCreation(s: Sponsorship): Either<SponsorError, Sponsorship> {
        if (s.season.isBlank()) return failure(SponsorError.ValidationError("season cannot be blank"))
        if (s.price < 0.0) return failure(SponsorError.ValidationError("price cannot be negative"))
        when (s.type) {
            SponsorType.PUB -> if (s.pubOption == null) return failure(SponsorError.ValidationError("pubOption required for PUB type"))
            SponsorType.TEAM -> if (s.teamCategory == null || s.placement == null) return failure(SponsorError.ValidationError("teamCategory and placement required for TEAM type"))
            SponsorType.OTHER -> if (s.sport == null) return failure(SponsorError.ValidationError("sport required for OTHER type"))
        }
        return success(s)
    }

    /**
     * Returns true when the sponsorship is currently active.
     */
    fun isActive(s: Sponsorship): Boolean = s.status == SponsorshipStatus.ATIVO
}




