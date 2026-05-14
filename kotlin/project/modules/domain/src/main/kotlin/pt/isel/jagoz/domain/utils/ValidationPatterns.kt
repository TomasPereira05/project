package pt.isel.jagoz.domain.utils

/**
 * Object containing predefined regular expression patterns for common validation scenarios.
 */
object ValidationPatterns {
    /** Regular expression for Portuguese NIF (Tax Identification Number) - 9 digits. */
    val NIF = Regex("^\\d{9}$")

    /** Regular expression for Portuguese NISS (Social Security Number) - 11 digits. */
    val NISS = Regex("^\\d{11}$")

    /** Regular expression for phone numbers - 7 to 15 digits. */
    val PHONE = Regex("^\\d{7,15}$")

    /** Regular expression for Portuguese postal codes - format NNNN-NNN. */
    val POSTAL_CODE = Regex("^\\d{4}-\\d{3}$")

    /** Regular expression for email addresses - basic format validation. */
    val EMAIL = Regex("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$")

    /** Regular expression for Portuguese health service number - 9 digits. */
    val NUMEROUTENTE = Regex("^\\d{9}$")

    /** Regular expression for BI / CC / Passport - exactly 8 alphanumeric characters. */
    val BI = Regex("^[A-Za-z0-9]{8}$")
}
