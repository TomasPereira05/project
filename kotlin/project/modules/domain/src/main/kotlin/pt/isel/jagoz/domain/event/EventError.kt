package pt.isel.jagoz.domain.event

/** Erros de operações sobre eventos (gestão de backoffice). */
sealed class EventError {
    data class Validation(
        val message: String,
    ) : EventError()

    data class InvalidOperation(
        val message: String,
    ) : EventError()

    data class NotFound(
        val message: String,
    ) : EventError()
}
