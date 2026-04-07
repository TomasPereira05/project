package pt.isel.athlete

import kotlinx.datetime.LocalDate
import org.springframework.stereotype.Component
import pt.isel.sponsor.TeamCategory
import pt.isel.utils.Either
import pt.isel.utils.ValidationError
import pt.isel.utils.ValidationPatterns
import pt.isel.utils.ValidationUtils
import pt.isel.utils.failure
import pt.isel.utils.success

/**
 * Errors produced by athlete domain operations.
 */
sealed class AthleteError {
    /** Attempted operation is invalid given the current athlete state. */
    data class InvalidOperation(val message: String) : AthleteError()

    /** Input validation failure. */
    data class ValidationError(val message: String) : AthleteError()

    /** Generic domain error. */
    data class DomainError(val message: String) : AthleteError()
}

/**
 * Pure domain operations for [Athlete]. All functions return [Either]<[AthleteError], T>
 * where the right side contains the successful result.
 */
@Component
class AthleteDomain {
    /**
     * Validate an [Athlete] for creation.
     *
     * This function delegates checks to smaller helpers for presence, plausibility
     * and pattern validation. It also validates each guardian using
     * [validateGuardianForCreation]. Returns the first validation error encountered
     * as a [ValidationError] (wrapped in [Either.Left]) or the original athlete on success.
     */
    fun validateForCreation(athlete: Athlete): Either<ValidationError, Athlete> {
        requireNotBlackInAthlete(athlete)?.let { return failure(it) }
        requireConditionInAthlete(athlete)?.let { return failure(it) }
        requireRegexInAthlete(athlete)?.let { return failure(it) }

        athlete.guardians.forEach { g ->
            when (val res = validateGuardianForCreation(g)) {
                is Either.Left -> return failure(res.value)
                is Either.Right -> { /* ok */ }
            }
        }

        return success(athlete)
    }

    /**
     * Helper that checks required (non-blank) fields for an athlete.
     *
     * Returns a [ValidationError] when a required field is blank or null, or null
     * when all required fields are present.
     */
    private fun requireNotBlackInAthlete(athlete: Athlete): ValidationError? {
        ValidationUtils.requireNotBlank(athlete.nationality, "nationality")?.let { return it }
        ValidationUtils.requireNotBlank(athlete.birthplace, "birthplace")?.let { return it }
        ValidationUtils.requireNotBlank(athlete.bi, "bi")?.let { return it }
        ValidationUtils.requireNotBlank(athlete.nif, "nif")?.let { return it }
        ValidationUtils.requireNotBlank(athlete.niss, "niss")?.let { return it }
        ValidationUtils.requireNotBlank(athlete.numeroUtente, "numeroUtente")?.let { return it }
        ValidationUtils.requireNotBlank(athlete.email, "email")?.let { return it }
        ValidationUtils.requireNotBlank(athlete.phone, "phone")?.let { return it }
        ValidationUtils.requireNotBlank(athlete.postalCode, "postalCode")?.let { return it }
        ValidationUtils.requireNotBlank(athlete.address, "address")?.let { return it }
        ValidationUtils.requireNotBlank(athlete.city, "city")?.let { return it }
        ValidationUtils.requireNotBlank(athlete.state, "state")?.let { return it }
        return null
    }

    /**
     * Helper that checks plausibility conditions for athlete dates.
     *
     * Examples: birthdate not unrealistically old, BI expiration after birthdate
     * and BI expiration is a realistic future date.
     * Returns the first failing [ValidationError] or null if all ok.
     */
    private fun requireConditionInAthlete(athlete: Athlete): ValidationError? {
        ValidationUtils.requireCondition(
            athlete.birthdate >= LocalDate.parse("1900-01-01"),
            "birthdate",
            "is unrealistic",
        )?.let { return it }
        ValidationUtils.requireCondition(athlete.biExpirationDate > athlete.birthdate, "biExpirationDate", "must be after birthdate")?.let {
            return it
        }
        ValidationUtils.requireCondition(
            athlete.biExpirationDate >= LocalDate.parse("2000-01-01"),
            "biExpirationDate",
            "must be a realistic date",
        )?.let {
            return it
        }
        return null
    }

    /**
     * Helper that checks pattern/format constraints for identification and
     * contact fields (nif, niss, numeroUtente, bi, email, phone, postalCode).
     * Returns the first failing [ValidationError] or null on success.
     */
    private fun requireRegexInAthlete(athlete: Athlete): ValidationError? {
        ValidationUtils.requireRegex(athlete.nif, ValidationPatterns.NIF, "nif", "must be 9 digits")?.let { return it }
        ValidationUtils.requireRegex(athlete.niss, ValidationPatterns.NISS, "niss", "must be 9 digits")?.let { return it }
        ValidationUtils.requireRegex(athlete.numeroUtente, ValidationPatterns.NUMEROUTENTE, "numeroUtente", "must be 6 to 9 digits")?.let {
            return it
        }
        ValidationUtils.requireRegex(athlete.bi, ValidationPatterns.BI, "bi", "must be 8 digits")?.let { return it }
        ValidationUtils.requireRegex(athlete.email, ValidationPatterns.EMAIL, "email", "must be a valid address")?.let { return it }
        ValidationUtils.requireRegex(athlete.phone, ValidationPatterns.PHONE, "phone", "must be 7 to 15 digits")?.let { return it }
        ValidationUtils.requireRegex(
            athlete.postalCode,
            ValidationPatterns.POSTAL_CODE,
            "postalCode",
            "must match 'NNNN-NNN'",
        )?.let { return it }

        return null
    }

    /**
     * Validate a [Guardian] when creating or updating it for an athlete.
     *
     * Returns an [Either.Left] containing the first [ValidationError] found
     * or [Either.Right] with the guardian when validation succeeds.
     */
    fun validateGuardianForCreation(guardian: Guardian): Either<ValidationError, Guardian> {
        ValidationUtils.requireNotBlank(guardian.name, "name")?.let { return failure(it) }
        ValidationUtils.requireNotBlank(guardian.kinship, "kinship")?.let { return failure(it) }

        ValidationUtils.requireNotBlank(guardian.email, "email")?.let { return failure(it) }
        ValidationUtils.requireRegex(
            guardian.email,
            ValidationPatterns.EMAIL,
            "email",
            "must be a valid email",
        )?.let { return failure(it) }

        ValidationUtils.requireNotBlank(guardian.phone, "phone")?.let { return failure(it) }
        ValidationUtils.requireRegex(
            guardian.phone,
            ValidationPatterns.PHONE,
            "phone",
            "must be 7 to 15 digits",
        )?.let { return failure(it) }

        return success(guardian)
    }


    /**
     * Change the athlete's team category.
     *
     * Returns the updated athlete wrapped in [Either.Right] when successful
     * or [Either.Left] with an [AthleteError.DomainError] when the new
     * category equals the current one.
     */
    fun changeTeamCategory(
        athlete: Athlete,
        newCategory: TeamCategory,
    ): Either<AthleteError, Athlete> {
        if (athlete.teamCategory == newCategory) return failure(AthleteError.DomainError("already in category $newCategory"))
        return success(athlete.copy(teamCategory = newCategory))
    }

    /**
     * Mark an athlete as inactive. Returns a copy with `active = false` on success
     * or [AthleteError.InvalidOperation] if the athlete is already inactive.
     */
    fun markInactive(athlete: Athlete): Either<AthleteError, Athlete> {
        if (!athlete.active) return failure(AthleteError.InvalidOperation("athlete already inactive"))
        return success(athlete.copy(active = false))
    }


    /**
     * Reactivate a previously inactive athlete. Returns the updated athlete on success
     * or [AthleteError.InvalidOperation] if the athlete is already active.
     */
    fun reactivate(athlete: Athlete): Either<AthleteError, Athlete> {
        if (athlete.active) return failure(AthleteError.InvalidOperation("athlete already active"))
        return success(athlete.copy(active = true))
    }


    /**
     * Update school-related information for the athlete (school, year, class).
     * Always returns the updated athlete; no validation is performed here.
     */
    fun updateSchoolInfo(
        athlete: Athlete,
        school: String?,
        schoolYear: String?,
        schoolClass: String?,
    ): Either<AthleteError, Athlete> {
        return success(athlete.copy(school = school, schoolYear = schoolYear, schoolClass = schoolClass))
    }


    /**
     * Update identification documents for an athlete.
     *
     * Performs minimal validation using presence checks and a plausibility
     * check for the BI expiration date. Returns the updated athlete or a
     * [AthleteError.ValidationError] when validation fails.
     */
    fun updateDocuments(
        athlete: Athlete,
        nif: String,
        niss: String,
        numeroUtente: String,
        bi: String,
        biExpirationDate: LocalDate,
    ): Either<AthleteError, Athlete> {
        if (nif.isBlank()) return failure(AthleteError.ValidationError("nif cannot be blank"))
        if (niss.isBlank()) return failure(AthleteError.ValidationError("niss cannot be blank"))
        if (numeroUtente.isBlank()) return failure(AthleteError.ValidationError("numeroUtente cannot be blank"))
        if (bi.isBlank()) return failure(AthleteError.ValidationError("bi cannot be blank"))
        if (biExpirationDate < LocalDate.parse("2000-01-01")) {
            return failure(
                AthleteError.ValidationError("biExpirationDate must be a realistic date"),
            )
        }
        return success(
            athlete.copy(
                nif = nif,
                niss = niss,
                numeroUtente = numeroUtente,
                bi = bi,
                biExpirationDate = biExpirationDate,
            ),
        )
    }
}
