package pt.isel.jagoz.domain.utils

/**
 * Represents validation errors that can occur during input validation.
 */
sealed class ValidationError {
    /**
     * Represents a validation error for a specific field.
     * @property field the name of the field that failed validation
     * @property message the error message describing the validation failure
     */
    data class FieldError(
        val field: String,
        val message: String,
    ) : ValidationError()

    /**
     * Represents a global validation error not tied to a specific field.
     * @property message the error message describing the validation failure
     */
    data class GlobalError(
        val message: String,
    ) : ValidationError()
}

/**
 * Utility object providing common validation functions.
 */
object ValidationUtils {
    /**
     * Validates that a string value is not blank (not null, empty, or whitespace-only).
     *
     * @param value the string value to validate
     * @param field the name of the field being validated (used in error messages)
     * @return a [ValidationError.FieldError] if validation fails, null otherwise
     */
    fun requireNotBlank(
        value: String,
        field: String,
    ): ValidationError? {
        if (value.isBlank()) {
            return ValidationError.FieldError(field, "cannot be blank")
        }
        return null
    }

    /**
     * Validates that a string value matches the given regular expression.
     *
     * @param value the string value to validate
     * @param regex the regular expression pattern to match against
     * @param field the name of the field being validated (used in error messages)
     * @param message the error message to use if validation fails
     * @return a [ValidationError.FieldError] if validation fails, null otherwise
     */
    fun requireRegex(
        value: String,
        regex: Regex,
        field: String,
        message: String,
    ): ValidationError? {
        if (!value.matches(regex)) {
            return ValidationError.FieldError(field, message)
        }
        return null
    }

    /**
     * Validates that a boolean condition is true.
     *
     * @param condition the boolean condition to evaluate
     * @param field the name of the field being validated (used in error messages)
     * @param message the error message to use if validation fails
     * @return a [ValidationError.FieldError] if validation fails, null otherwise
     */
    fun requireCondition(
        condition: Boolean,
        field: String,
        message: String,
    ): ValidationError? {
        if (!condition) {
            return ValidationError.FieldError(field, message)
        }
        return null
    }
}
