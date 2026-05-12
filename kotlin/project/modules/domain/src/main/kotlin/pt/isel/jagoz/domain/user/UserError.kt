package pt.isel.jagoz.domain.user

sealed class UserError {
    data class NotFound(
        val field: String,
        val value: Any,
    ) : UserError()

    data class AlreadyExists(
        val field: String,
        val value: Any,
    ) : UserError()

    data class Validation(
        val message: String,
    ) : UserError()

    data class Unauthorized(
        val message: String,
    ) : UserError()
}
