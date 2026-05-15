package pt.isel.jagoz.domain.athlete

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

    /** The authenticated user already has an athlete registration. */
    data class AlreadyRegistered(
        val userId: Long,
    ) : AthleteError()

    /** The provided team category does not exist. */
    data class TeamCategoryNotFound(
        val teamCategoryId: Long,
    ) : AthleteError()

    /** A guardian references a `memberNumber` that does not match any existing Member. */
    data class GuardianMemberNotFound(
        val memberNumber: Int,
    ) : AthleteError()

    /** Operation rejected because of the athlete's current state (active/inactive/pending/...). */
    data class InvalidStateTransition(
        val athleteId: Long,
        val currentStatus: String,
        val attempted: String,
    ) : AthleteError()

    /** A date field in the athlete payload is invalid (out of range, in the past, ...). */
    data class InvalidDateField(
        val field: String,
        val reason: String,
    ) : AthleteError()
}
