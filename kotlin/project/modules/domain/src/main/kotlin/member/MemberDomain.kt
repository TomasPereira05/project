package pt.isel.member

import kotlinx.datetime.LocalDate
import org.springframework.stereotype.Component
import pt.isel.utils.Either
import pt.isel.utils.ValidationError
import pt.isel.utils.ValidationPatterns
import pt.isel.utils.ValidationUtils
import pt.isel.utils.failure
import pt.isel.utils.success

/**
 * Errors produced by member domain operations.
 *
 * Use these types to indicate why a domain operation failed. They are returned inside
 * the [Either.Left] value when an operation cannot be completed.
 */
sealed class MemberError {
    /**
     * Indicates an invalid state transition was attempted.
     * @property from the current member status
     * @property attempted the name of the attempted operation (e.g. "approve")
     */
    data class InvalidTransition(val from: MemberStatus, val attempted: String) : MemberError()

    /**
     * Represents an input validation failure.
     * @property message a human-readable validation message
     */
    data class ValidationError(val message: String) : MemberError()

    /**
     * Generic domain error for cases that don't fit other variants.
     * @property message a description of the error
     */
    data class DomainError(val message: String) : MemberError()
}

/**
 * Domain operations for `Member`.
 * Implemented as pure functions returning [Either]<[MemberError], [Member]> so callers
 * can handle failures explicitly.
 */
@Component
class MemberDomain {
    /**
     * Approve a pending member application.
     *
     * Preconditions:
     * - The member's status must be [MemberStatus.PENDENTE].
     * - The [approvalDate] must not be before the member's registrationDate.
     *
     * Postconditions:
     * - returns a copy of [member] with status set to [MemberStatus.ATIVO], approvalDate set
     *   to [approvalDate] and monthlyQuota adjusted according to the member category
     *   (ATLETA_SOCIO -> 0.0, SOCIO -> at least 1.5).
     *
     * Errors:
     * - Returns [MemberError.InvalidTransition] when the current status is not PENDENTE.
     * - Returns [MemberError.ValidationError] when approvalDate < registrationDate.
     *
     * @param member the member to approve
     * @param approvalDate the date of approval (by directors)
     * @return Either a [MemberError] describing the failure or the updated [Member]
     */
    fun approve(
        member: Member,
        approvalDate: LocalDate,
    ): Either<MemberError, Member> {
        if (member.status != MemberStatus.PENDENTE) {
            return failure(MemberError.InvalidTransition(member.status, "approve"))
        }
        if (approvalDate < member.registrationDate) {
            return failure(MemberError.ValidationError("approvalDate cannot be before registrationDate"))
        }

        val newQuota =
            when (member.category) {
                MemberCategory.ATLETA_SOCIO -> 0.0
                MemberCategory.SOCIO -> maxOf(member.monthlyQuota, 1.5)
            }

        val updated =
            member.copy(
                status = MemberStatus.ATIVO,
                approvalDate = approvalDate,
                monthlyQuota = newQuota,
            )

        return success(updated)
    }

    /**
     * Reject a pending member application.
     *
     * Preconditions:
     * - The member's status must be [MemberStatus.PENDENTE].
     *
     * Postconditions:
     * - returns a copy of [member] with status set to [MemberStatus.REJEITADO].
     *
     * Errors:
     * - Returns [MemberError.InvalidTransition] when the current status is not PENDENTE.
     *
     * @param member the member to reject
     * @return Either a [MemberError] or the updated [Member]
     */
    fun reject(member: Member): Either<MemberError, Member> {
        if (member.status != MemberStatus.PENDENTE) {
            return failure(MemberError.InvalidTransition(member.status, "reject"))
        }
        return success(member.copy(status = MemberStatus.REJEITADO))
    }

    /**
     * Deactivate an active member.
     *
     * Preconditions:
     * - The member's status must be [MemberStatus.ATIVO].
     *
     * Postconditions:
     * - returns a copy of [member] with status set to [MemberStatus.INATIVO].
     *
     * Errors:
     * - Returns [MemberError.InvalidTransition] when the current status is not ATIVO.
     *
     * @param member the member to deactivate
     * @return Either a [MemberError] or the updated [Member]
     */
    fun deactivate(member: Member): Either<MemberError, Member> {
        if (member.status != MemberStatus.ATIVO) {
            return failure(MemberError.InvalidTransition(member.status, "deactivate"))
        }
        return success(member.copy(status = MemberStatus.INATIVO))
    }

    /**
     * Reactivate an inactive member (set status to ATIVO).
     *
     * Preconditions:
     * - The member's status must be [MemberStatus.INATIVO].
     * - The [reactivationDate] must not be before the member's registrationDate.
     *
     * Postconditions:
     * - returns a copy of [member] with status set to [MemberStatus.ATIVO], approvalDate set
     *   to [reactivationDate] and monthlyQuota adjusted according to category rules.
     *
     * Errors:
     * - Returns [MemberError.InvalidTransition] when the current status is not INATIVO.
     * - Returns [MemberError.ValidationError] when reactivationDate < registrationDate.
     *
     * @param member the member to reactivate
     * @param reactivationDate date to record as approval/reauthorization
     * @return Either a [MemberError] or the updated [Member]
     */
    fun reactivate(
        member: Member,
        reactivationDate: LocalDate,
    ): Either<MemberError, Member> {
        if (member.status != MemberStatus.INATIVO) {
            return failure(MemberError.InvalidTransition(member.status, "reactivate"))
        }
        if (reactivationDate < member.registrationDate) {
            return failure(MemberError.ValidationError("reactivationDate cannot be before registrationDate"))
        }
        val newQuota =
            when (member.category) {
                MemberCategory.ATLETA_SOCIO -> 0.0
                MemberCategory.SOCIO -> maxOf(member.monthlyQuota, 1.5)
            }
        return success(member.copy(status = MemberStatus.ATIVO, approvalDate = reactivationDate, monthlyQuota = newQuota))
    }

    /**
     * Update the contact details of a member.
     *
     * Performs light validation on email and phone; more complex validations should be
     * enforced by higher-level application services as needed.
     *
     * @param member the member to update
     * @param email new email address (must contain '@')
     * @param phone new phone number (non-empty)
     * @param address new street address
     * @param postalCode new postal code
     * @param city new city
     * @param homePhone optional home phone
     * @param billingLocation optional billing location
     * @return Either a [MemberError] or the updated [Member]
     */
    fun updateContact(
        member: Member,
        email: String,
        phone: String,
        address: String,
        postalCode: String,
        city: String,
        homePhone: String? = null,
        billingLocation: String? = null,
    ): Either<MemberError, Member> {
        if (email.isBlank() || !email.contains("@")) {
            return failure(MemberError.ValidationError("invalid email"))
        }
        if (phone.isBlank()) {
            return failure(MemberError.ValidationError("phone cannot be empty"))
        }

        return success(
            member.copy(
                email = email,
                phone = phone,
                homePhone = homePhone,
                address = address,
                postalCode = postalCode,
                city = city,
                billingLocation = billingLocation,
            ),
        )
    }

    /**
     * Change the member category between [MemberCategory.SOCIO] and [MemberCategory.ATLETA_SOCIO].
     *
     * Postconditions:
     * - Returns a copy of [member] in the new category with monthlyQuota adjusted according
     *   to category rules (ATLETA_SOCIO -> 0.0, SOCIO -> at least 1.5).
     *
     * Errors:
     * - Returns [MemberError.DomainError] when the member already belongs to [newCategory].
     *
     * @param member the member to change
     * @param newCategory the target category
     * @return Either a [MemberError] or the updated [Member]
     */
    fun changeCategory(
        member: Member,
        newCategory: MemberCategory,
    ): Either<MemberError, Member> {
        if (member.category == newCategory) {
            return failure(MemberError.DomainError("member already in category $newCategory"))
        }
        val newQuota =
            when (newCategory) {
                MemberCategory.ATLETA_SOCIO -> 0.0
                MemberCategory.SOCIO -> maxOf(member.monthlyQuota, 1.5)
            }
        return success(member.copy(category = newCategory, monthlyQuota = newQuota))
    }

    /**
     * Compute the canonical monthly quota for the given [member] according to business rules.
     *
     * - [MemberCategory.ATLETA_SOCIO] -> 0.0
     * - [MemberCategory.SOCIO] -> at least 1.5 or the existing monthlyQuota if higher
     *
     * @param member the member whose quota to compute
     * @return the computed monthly quota
     */
    fun calculateMonthlyQuota(member: Member): Double =
        when (member.category) {
            MemberCategory.ATLETA_SOCIO -> 0.0
            MemberCategory.SOCIO -> maxOf(member.monthlyQuota, 1.5)
        }

    /**
     * Validate a [Member] before creation.
     *
     * The function delegates checks to smaller helpers for presence, condition and
     * regex-based validation. Returns the first encountered [ValidationError]
     * wrapped in [Either.Left], or the original member on success.
     */
    fun validateForCreation(member: Member): Either<ValidationError, Member> {
        requireNotBlankInMember(member)?.let { return failure(it) }
        requireConditionInMember(member)?.let { return failure(it) }
        requireRegexInMember(member)?.let { return failure(it) }
        return success(member)
    }

    /**
     * Helper that ensures required (non-blank) member fields are present.
     *
     * Returns a [ValidationError] for the first blank field found, or null when
     * all required fields are present.
     */
    private fun requireNotBlankInMember(member: Member): ValidationError? {
        ValidationUtils.requireNotBlank(member.completeName, "completeName")?.let { return it }
        ValidationUtils.requireNotBlank(member.email, "email")?.let { return it }
        ValidationUtils.requireNotBlank(member.phone, "phone")?.let { return it }
        ValidationUtils.requireNotBlank(member.address, "address")?.let { return it }
        ValidationUtils.requireNotBlank(member.postalCode, "postalCode")?.let { return it }
        ValidationUtils.requireNotBlank(member.city, "city")?.let { return it }
        return null
    }

    /**
     * Helper that checks pattern constraints for contact fields.
     *
     * Validates email, phone and postal code formats and returns the first
     * failing [ValidationError] or null if all patterns match.
     */
    private fun requireRegexInMember(member: Member): ValidationError? {
        ValidationUtils.requireRegex(member.email, ValidationPatterns.EMAIL, "email", "must be a valid address")?.let { return it }
        ValidationUtils.requireRegex(member.phone, ValidationPatterns.PHONE, "phone", "must be 7 to 15 digits")?.let { return it }
        ValidationUtils.requireRegex(
            member.postalCode,
            ValidationPatterns.POSTAL_CODE,
            "postalCode",
            "must match 'NNNN-NNN'",
        )?.let { return it }
        return null
    }

    /**
     * Helper that enforces numeric/date conditions for a member.
     *
     * Examples: monthly quota non-negative, registration date plausible and
     * birthdate not unrealistically old. Returns the first failing
     * [ValidationError] or null when all conditions pass.
     */
    private fun requireConditionInMember(member: Member): ValidationError? {
        ValidationUtils.requireCondition(member.monthlyQuota >= 0.0, "monthlyQuota", "cannot be negative")?.let { return it }
        ValidationUtils.requireCondition(
            member.registrationDate <= LocalDate.parse("9999-12-31"),
            "registrationDate",
            "invalid",
        )?.let { return it }
        ValidationUtils.requireCondition(
            member.birthDate >= LocalDate.parse("1900-01-01"),
            "birthDate",
            "is unrealistic",
        )?.let { return it }
        return null
    }
}
