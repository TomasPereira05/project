package pt.isel.jagoz.member

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
     * Indicates an invalid operation was attempted.
     * @property operation the name of the attempted operation
     * @property reason explanation of why the operation is invalid
     */
    data class InvalidOperation(val operation: String, val reason: String) : MemberError() // 409

    /**
     * Indicates a conflict with existing data.
     * @property message description of the conflict
     */
    data class Conflict(val message: String) : MemberError() // 409

    /**
     * Represents an input validation failure.
     * @property message a human-readable validation message
     */
    data class ValidationError(val message: String) : MemberError() // 400

    /**
     * Indicates the request lacks valid authentication credentials.
     * @property message optional custom error message
     */
    data class Unauthorized(val message: String = "Unauthorized") : MemberError() // 401

    /**
     * Indicates the server understood the request but refuses to authorize it.
     * @property message optional custom error message
     */
    data class Forbidden(val message: String = "Forbidden") : MemberError() // 403

    /**
     * Indicates an attempt to create a resource that already exists.
     * @property entity the type of entity that already exists
     * @property field the field that contains the duplicate value
     * @property value the duplicate value
     */
    data class AlreadyExists(val entity: String, val field: String, val value: Any) : MemberError() {
        override fun toString() = "$entity with $field '$value' already exists"
    } // 409

    /**
     * Indicates the requested resource was not found.
     * @property entity the type of entity that was not found
     * @property id the identifier of the entity that was not found
     */
    data class NotFound(val entity: String, val id: Any) : MemberError() // 404

    /**
     * Generic domain error for cases that don't fit other variants.
     * @property message a description of the error
     */
    data class DomainError(val message: String) : MemberError() // 400 or 500
}
