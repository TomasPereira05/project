package pt.isel.jagoz.domain.team

sealed class TeamError {
    /**
     * Validation failure (e.g. invalid input).
     * @param message human-readable message describing the validation problem
     */
    data class ValidationError(
        val message: String,
    ) : TeamError()

    /**
     * Generic domain error.
     * @param message description of the domain error
     */
    data class DomainError(
        val message: String,
    ) : TeamError()

    data class NotFound(
        val message: String,
    ) : TeamError() // 404
}
