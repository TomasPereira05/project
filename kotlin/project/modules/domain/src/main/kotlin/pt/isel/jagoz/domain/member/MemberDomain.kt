package pt.isel.jagoz.domain.member

import kotlinx.datetime.LocalDate
import org.springframework.stereotype.Component
import pt.isel.jagoz.domain.utils.ATHLETE_MEMBER_QUOTA
import pt.isel.jagoz.domain.utils.Either
import pt.isel.jagoz.domain.utils.MAX_REGISTRATION_DATE
import pt.isel.jagoz.domain.utils.MIN_BIRTH_DATE
import pt.isel.jagoz.domain.utils.REGULAR_MEMBER_MIN_QUOTA
import pt.isel.jagoz.domain.utils.ValidationError
import pt.isel.jagoz.domain.utils.ValidationPatterns
import pt.isel.jagoz.domain.utils.ValidationUtils
import pt.isel.jagoz.domain.utils.failure
import pt.isel.jagoz.domain.utils.success

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
                MemberCategory.ATLETA_SOCIO -> ATHLETE_MEMBER_QUOTA // 0 cÃªntimos - nÃ£o paga quota
                MemberCategory.SOCIO -> maxOf(member.membershipQuota, REGULAR_MEMBER_MIN_QUOTA) // mÃ­nimo 150 cÃªntimos (1.50â‚¬)
            }

        val updated =
            member.copy(
                status = MemberStatus.ATIVO,
                approvalDate = approvalDate,
                membershipQuota = newQuota,
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
                MemberCategory.ATLETA_SOCIO -> ATHLETE_MEMBER_QUOTA
                MemberCategory.SOCIO -> maxOf(member.membershipQuota, REGULAR_MEMBER_MIN_QUOTA)
            }
        return success(member.copy(status = MemberStatus.ATIVO, approvalDate = reactivationDate, membershipQuota = newQuota))
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
        ValidationUtils.requireNotBlank(email, "email")?.let { return failure(it.toMemberError()) }
        ValidationUtils.requireRegex(email, ValidationPatterns.EMAIL, "email", "must be valid")?.let { return failure(it.toMemberError()) }

        ValidationUtils.requireNotBlank(phone, "phone")?.let { return failure(it.toMemberError()) }
        ValidationUtils.requireNotBlank(address, "address")?.let { return failure(it.toMemberError()) }
        ValidationUtils.requireNotBlank(postalCode, "postalCode")?.let { return failure(it.toMemberError()) }
        ValidationUtils.requireNotBlank(city, "city")?.let { return failure(it.toMemberError()) }

        ValidationUtils.requireRegex(postalCode, ValidationPatterns.POSTAL_CODE, "postalCode", "must match 'NNNN-NNN'")
            ?.let { return failure(it.toMemberError()) }
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
            return failure(
                MemberError.Conflict(
                    "member already in category $newCategory",
                ),
            )
        }
        val newQuota =
            when (newCategory) {
                MemberCategory.ATLETA_SOCIO -> ATHLETE_MEMBER_QUOTA
                MemberCategory.SOCIO -> maxOf(member.membershipQuota, REGULAR_MEMBER_MIN_QUOTA)
            }
        return success(member.copy(category = newCategory, membershipQuota = newQuota))
    }

    /**
     * Compute the canonical membership quota for the given [member] according to business rules.
     * Values are in cents (centimos).
     *
     * - [MemberCategory.ATLETA_SOCIO] -> 0 cents
     * - [MemberCategory.SOCIO] -> at least 150 cents (1.50â‚¬) or the existing membershipQuota if higher
     *
     * @param member the member whose quota to compute
     * @return the computed membership quota in cents
     */
    fun calculateMembershipQuota(member: Member): Int =
        when (member.category) {
            MemberCategory.ATLETA_SOCIO -> ATHLETE_MEMBER_QUOTA
            MemberCategory.SOCIO -> maxOf(member.membershipQuota, REGULAR_MEMBER_MIN_QUOTA)
        }

    /**
     * Validate a [Member] before creation.
     *
     * The function delegates checks to smaller helpers for presence, condition and
     * regex-based validation. Returns the first encountered [ValidationError]
     * wrapped in [Either.Left], or the original member on success.
     */
    fun validateForCreation(member: Member): Either<MemberError, Member> {
        requireNotBlankInMember(member)?.let { return failure(it.toMemberError()) }
        requireRegexInMember(member)?.let { return failure(it.toMemberError()) }
        requireConditionInMember(member)?.let { return failure(it.toMemberError()) }
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
        ValidationUtils.requireNotBlank(member.nif, "nif")?.let { return it }
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
        ValidationUtils.requireRegex(member.nif, ValidationPatterns.NIF, "nif", "must be 9 digits")?.let { return it }
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
     * Examples: membership quota non-negative, registration date plausible and
     * birthdate not unrealistically old. Returns the first failing
     * [ValidationError] or null when all conditions pass.
     */
    private fun requireConditionInMember(member: Member): ValidationError? {
        ValidationUtils.requireCondition(member.membershipQuota >= 0, "membershipQuota", "cannot be negative")?.let { return it }
        ValidationUtils.requireCondition(
            member.registrationDate <= MAX_REGISTRATION_DATE,
            "registrationDate",
            "invalid",
        )?.let { return it }
        ValidationUtils.requireCondition(
            member.birthDate >= MIN_BIRTH_DATE,
            "birthDate",
            "is unrealistic",
        )?.let { return it }
        ValidationUtils.requireCondition(
            member.birthDate < member.registrationDate,
            "birthDate",
            "must be before today",
        )?.let { return it }
        return null
    }

    private fun ValidationError.toMemberError(): MemberError.ValidationError =
        when (this) {
            is ValidationError.FieldError -> MemberError.ValidationError("$field $message")
            is ValidationError.GlobalError -> MemberError.ValidationError(message)
        }
}
