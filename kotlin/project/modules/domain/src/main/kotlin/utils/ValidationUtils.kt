package pt.isel.utils

sealed class ValidationError {
    data class FieldError(
        val field: String,
        val message: String,
    ) : ValidationError()

    data class GlobalError(
        val message: String,
    ) : ValidationError()
}

object ValidationUtils {
    fun requireNotBlank(
        value: String,
        field: String,
    ): ValidationError? {
        if (value.isBlank()) {
            return ValidationError.FieldError(field, "cannot be blank")
        }
        return null
    }

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
