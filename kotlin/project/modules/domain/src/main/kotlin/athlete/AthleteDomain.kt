package pt.isel.athlete

import kotlinx.datetime.LocalDate
import org.springframework.stereotype.Component
import pt.isel.sponsor.TeamCategory
import pt.isel.utils.Either
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
     * Validate the athlete data for creation.
     *
     * Checks performed:
     * - nationality, birthplace, bi, nif, niss and numeroUtente are not blank
     * - biExpirationDate is after birthDate
     *
     * @return Either a [AthleteError] or the given [athlete]
     */
    fun validateForCreation(athlete: Athlete): Either<AthleteError, Athlete> {
        if (athlete.nationality.isBlank()) return failure(AthleteError.ValidationError("nationality cannot be blank"))
        if (athlete.birthplace.isBlank()) return failure(AthleteError.ValidationError("birthplace cannot be blank"))
        if (athlete.bi.isBlank()) return failure(AthleteError.ValidationError("bi cannot be blank"))
        if (athlete.nif.isBlank()) return failure(AthleteError.ValidationError("nif cannot be blank"))
        if (athlete.niss.isBlank()) return failure(AthleteError.ValidationError("niss cannot be blank"))
        if (athlete.numeroUtente.isBlank()) return failure(AthleteError.ValidationError("numeroUtente cannot be blank"))
        // Athlete model does not contain birthDate; require expiration to be a plausible future date
        if (athlete.biExpirationDate < LocalDate.parse("2000-01-01")) {
            return failure(
                AthleteError.ValidationError("biExpirationDate must be a realistic date"),
            )
        }
        return success(athlete)
    }

    /**
     * Change the athlete's team category.
     *
     * Errors:
     * - returns [AthleteError.DomainError] when the category is unchanged.
     */
    fun changeTeamCategory(
        athlete: Athlete,
        newCategory: TeamCategory,
    ): Either<AthleteError, Athlete> {
        if (athlete.teamCategory == newCategory) return failure(AthleteError.DomainError("already in category $newCategory"))
        return success(athlete.copy(teamCategory = newCategory))
    }

    /**
     * Mark the athlete as inactive.
     *
     * Errors:
     * - returns [AthleteError.InvalidOperation] when already inactive.
     */
    fun markInactive(athlete: Athlete): Either<AthleteError, Athlete> {
        if (!athlete.active) return failure(AthleteError.InvalidOperation("athlete already inactive"))
        return success(athlete.copy(active = false))
    }

    /**
     * Reactivate an inactive athlete.
     *
     * Errors:
     * - returns [AthleteError.InvalidOperation] when already active.
     */
    fun reactivate(athlete: Athlete): Either<AthleteError, Athlete> {
        if (athlete.active) return failure(AthleteError.InvalidOperation("athlete already active"))
        return success(athlete.copy(active = true))
    }

    /**
     * Update school-related information for the athlete.
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
     * Update identification documents. Performs minimal validation.
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
