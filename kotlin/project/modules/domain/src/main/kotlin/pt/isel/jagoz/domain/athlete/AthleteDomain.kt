package pt.isel.jagoz.domain.athlete

import kotlinx.datetime.LocalDate
import org.springframework.stereotype.Component
import pt.isel.jagoz.domain.team.TeamCategory
import pt.isel.jagoz.domain.utils.Either
import pt.isel.jagoz.domain.utils.ValidationError
import pt.isel.jagoz.domain.utils.ValidationPatterns
import pt.isel.jagoz.domain.utils.ValidationUtils
import pt.isel.jagoz.domain.utils.failure
import pt.isel.jagoz.domain.utils.success

/**
 * Errors produced by athlete domain operations.
 */
sealed class AthleteError {
    /** Requested resource was not found. */
    data class NotFound(
        val field: String,
        val value: Any,
    ) : AthleteError()

    /** Attempted operation is invalid given the current athlete state. */
    data class InvalidOperation(
        val message: String,
    ) : AthleteError()

    /** Input validation failure. */
    data class ValidationError(
        val message: String,
    ) : AthleteError()

    /** Generic domain error. */
    data class DomainError(
        val message: String,
    ) : AthleteError()
}

/**
 * Pure domain operations for [Athlete]. All functions return [Either]<[AthleteError], T>
 * where the right side contains the successful result.
 *
 * Validações ligadas a campos que agora vivem no Member (birthdate, nif, email, phone,
 * morada) são responsabilidade do [pt.isel.jagoz.service.AthleteService] na altura da
 * inscrição, porque dependem de dois agregados (Member + Athlete) e portanto não cabem
 * no domínio puro do Atleta.
 */
@Component
class AthleteDomain {
    /**
     * Validate an [Athlete] for creation. Returns the first validation error encountered
     * as a [ValidationError] (wrapped in [Either.Left]) or the original athlete on success.
     */
    fun validateForCreation(athlete: Athlete): Either<ValidationError, Athlete> {
        requireNotBlankInAthlete(athlete)?.let { return failure(it) }
        requireConditionInAthlete(athlete)?.let { return failure(it) }
        requireRegexInAthlete(athlete)?.let { return failure(it) }

        athlete.guardians.forEach { g ->
            when (val res = validateGuardianForCreation(g)) {
                is Either.Left -> {
                    return failure(res.value)
                }

                is Either.Right -> { /* ok */ }
            }
        }

        return success(athlete)
    }

    private fun requireNotBlankInAthlete(athlete: Athlete): ValidationError? {
        ValidationUtils.requireNotBlank(athlete.nationality, "nationality")?.let { return it }
        ValidationUtils.requireNotBlank(athlete.bi, "bi")?.let { return it }
        ValidationUtils.requireNotBlank(athlete.niss, "niss")?.let { return it }
        ValidationUtils.requireNotBlank(athlete.numeroUtente, "numeroUtente")?.let { return it }
        return null
    }

    private fun requireConditionInAthlete(athlete: Athlete): ValidationError? {
        ValidationUtils
            .requireCondition(
                athlete.biExpirationDate >= LocalDate.parse("2000-01-01"),
                "biExpirationDate",
                "must be a realistic date",
            )?.let { return it }
        return null
    }

    private fun requireRegexInAthlete(athlete: Athlete): ValidationError? {
        ValidationUtils.requireRegex(athlete.niss, ValidationPatterns.NISS, "niss", "must be 11 digits")?.let { return it }
        ValidationUtils.requireRegex(athlete.numeroUtente, ValidationPatterns.NUMEROUTENTE, "numeroUtente", "must be 9 digits")?.let {
            return it
        }
        ValidationUtils.requireRegex(athlete.bi, ValidationPatterns.BI, "bi", "must be 8 alphanumeric characters")?.let { return it }
        return null
    }

    /**
     * Validate a [Guardian] when creating or updating it for an athlete.
     *
     * Regras condicionais ao [Guardian.role]:
     * - `LEGAL_GUARDIAN`: `kinship` e `contactPhone` obrigatórios.
     * - `FATHER`/`MOTHER`: `kinship` e `contactPhone` devem ficar a null (BD garante via CHECK).
     */
    fun validateGuardianForCreation(guardian: Guardian): Either<ValidationError, Guardian> {
        ValidationUtils.requireNotBlank(guardian.name, "name")?.let { return failure(it) }

        if (guardian.role == GuardianRole.LEGAL_GUARDIAN) {
            val kinship = guardian.kinship
            if (kinship.isNullOrBlank()) {
                return failure(ValidationError.FieldError("kinship", "is required for LEGAL_GUARDIAN"))
            }
            val contactPhone = guardian.contactPhone
            if (contactPhone.isNullOrBlank()) {
                return failure(ValidationError.FieldError("contactPhone", "is required for LEGAL_GUARDIAN"))
            }
            ValidationUtils
                .requireRegex(contactPhone, ValidationPatterns.PHONE, "contactPhone", "must be 7 to 15 digits")
                ?.let { return failure(it) }
        } else {
            if (guardian.professionalActivity.isNullOrBlank()) {
                return failure(ValidationError.FieldError("professionalActivity", "is required for FATHER and MOTHER"))
            }
        }

        ValidationUtils.requireNotBlank(guardian.email, "email")?.let { return failure(it) }
        ValidationUtils
            .requireRegex(guardian.email, ValidationPatterns.EMAIL, "email", "must be a valid email")
            ?.let { return failure(it) }

        ValidationUtils.requireNotBlank(guardian.phone, "phone")?.let { return failure(it) }
        ValidationUtils
            .requireRegex(guardian.phone, ValidationPatterns.PHONE, "phone", "must be 7 to 15 digits")
            ?.let { return failure(it) }

        return success(guardian)
    }

    /**
     * Change the athlete's team category.
     */
    fun changeTeamCategory(
        athlete: Athlete,
        newCategory: TeamCategory,
    ): Either<AthleteError, Athlete> {
        if (athlete.teamCategory == newCategory) return failure(AthleteError.DomainError("already in category $newCategory"))
        return success(athlete.copy(teamCategory = newCategory))
    }

    /**
     * Mark an athlete as inactive.
     */
    fun markInactive(athlete: Athlete): Either<AthleteError, Athlete> {
        if (!athlete.active) return failure(AthleteError.InvalidOperation("athlete already inactive"))
        return success(athlete.copy(active = false))
    }

    /**
     * Reactivate a previously inactive athlete.
     */
    fun reactivate(athlete: Athlete): Either<AthleteError, Athlete> {
        if (athlete.active) return failure(AthleteError.InvalidOperation("athlete already active"))
        return success(athlete.copy(active = true))
    }

    /**
     * Update school-related information for the athlete (school, year, class).
     */
    fun updateSchoolInfo(
        athlete: Athlete,
        school: String?,
        schoolYear: String?,
        schoolClass: String?,
    ): Either<AthleteError, Athlete> = success(athlete.copy(school = school, schoolYear = schoolYear, schoolClass = schoolClass))

    /**
     * Update identification documents for an athlete.
     */
    fun updateDocuments(
        athlete: Athlete,
        niss: String,
        numeroUtente: String,
        bi: String,
        biExpirationDate: LocalDate,
    ): Either<AthleteError, Athlete> {
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
                niss = niss,
                numeroUtente = numeroUtente,
                bi = bi,
                biExpirationDate = biExpirationDate,
            ),
        )
    }
}
