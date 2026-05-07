package pt.isel.jagoz.domain.sponsor

import org.springframework.stereotype.Component
import pt.isel.jagoz.domain.utils.Either
import pt.isel.jagoz.domain.utils.ValidationError
import pt.isel.jagoz.domain.utils.ValidationPatterns
import pt.isel.jagoz.domain.utils.ValidationUtils
import pt.isel.jagoz.domain.utils.failure
import pt.isel.jagoz.domain.utils.success

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
@Component
class SponsorDomain {
    fun cancelSponsorship(s: Sponsorship): Either<SponsorError, Sponsorship> {
        if (s.status == SponsorshipStatus.CANCELADO) {
            return failure(SponsorError.DomainError("already cancelled"))
        }

        return success(s.copy(status = SponsorshipStatus.CANCELADO))
    }

    fun approveSponsorship(s: Sponsorship): Either<SponsorError, Sponsorship> {
        if (s.status != SponsorshipStatus.SUBMETIDO) {
            return failure(
                SponsorError.InvalidTransition(s.status, "approve"),
            )
        }

        return success(s.copy(status = SponsorshipStatus.APROVADO))
    }

    fun validateForCreation(s: Sponsorship): Either<SponsorError, Sponsorship> {
        validateSponsorship(s)?.let { return failure(it.toSponsorError()) }

        return success(s)
    }

    fun markPaid(s: Sponsorship): Either<SponsorError, Sponsorship> {
        if (s.status != SponsorshipStatus.APROVADO) {
            return failure(
                SponsorError.InvalidTransition(s.status, "markPaid"),
            )
        }

        return success(s.copy(status = SponsorshipStatus.PAGO))
    }

    fun updateSponsor(
        sponsor: Sponsor,
        name: String,
        email: String,
        phone: String,
        nif: String,
    ): Either<SponsorError, Sponsor> {
        ValidationUtils.requireNotBlank(name, "name")?.let {
            return failure(it.toSponsorError())
        }

        ValidationUtils.requireNotBlank(email, "email")?.let {
            return failure(it.toSponsorError())
        }

        ValidationUtils.requireRegex(
            email,
            ValidationPatterns.EMAIL,
            "email",
            "invalid email format",
        )?.let {
            return failure(it.toSponsorError())
        }

        ValidationUtils.requireNotBlank(phone, "phone")?.let {
            return failure(it.toSponsorError())
        }

        ValidationUtils.requireNotBlank(nif, "nif")?.let {
            return failure(it.toSponsorError())
        }

        ValidationUtils.requireRegex(
            nif,
            ValidationPatterns.NIF,
            "nif",
            "invalid nif format",
        )?.let {
            return failure(it.toSponsorError())
        }

        return success(
            sponsor.copy(
                name = name,
                email = email,
                phone = phone,
                nif = nif,
            ),
        )
    }

    private fun validateSponsorship(s: Sponsorship): ValidationError? {
        ValidationUtils.requireNotBlank(s.season, "season")?.let { return it }

        ValidationUtils.requireCondition(
            s.price >= 0,
            "price",
            "cannot be negative",
        )?.let { return it }

        return when (s.type) {
            SponsorType.PUB -> {
                firstError(
                    ValidationUtils.requireNotNull(s.pubOptionId, "pubOptionId", "required for PUB type"),
                    ValidationUtils.requireNull(s.teamCategoryId, "teamCategoryId", "must be null for PUB type"),
                    ValidationUtils.requireNull(s.placementId, "placementId", "must be null for PUB type"),
                    ValidationUtils.requireNull(s.sportId, "sportId", "must be null for PUB type"),
                )
            }

            SponsorType.TEAM -> {
                firstError(
                    ValidationUtils.requireNull(s.pubOptionId, "pubOptionId", "required for PUB type"),
                    ValidationUtils.requireNotNull(s.teamCategoryId, "teamCategoryId", "must be null for PUB type"),
                    ValidationUtils.requireNotNull(s.placementId, "placementId", "must be null for PUB type"),
                    ValidationUtils.requireNull(s.sportId, "sportId", "must be null for PUB type"),
                )
            }

            SponsorType.OTHER -> {
                firstError(
                    ValidationUtils.requireNull(s.pubOptionId, "pubOptionId", "required for PUB type"),
                    ValidationUtils.requireNull(s.teamCategoryId, "teamCategoryId", "must be null for PUB type"),
                    ValidationUtils.requireNull(s.placementId, "placementId", "must be null for PUB type"),
                    ValidationUtils.requireNotNull(s.sportId, "sportId", "must be null for PUB type"),
                )
            }
        }
    }

    private fun ValidationError.toSponsorError(): SponsorError =
        when (this) {
            is ValidationError.FieldError ->
                SponsorError.ValidationError("$field $message")
            is ValidationError.GlobalError ->
                SponsorError.ValidationError(message)
        }

    private fun firstError(vararg validations: ValidationError?): ValidationError? = validations.firstOrNull { it != null }
}
