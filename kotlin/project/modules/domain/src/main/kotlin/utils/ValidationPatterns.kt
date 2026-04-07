package pt.isel.utils

object ValidationPatterns {
    val NIF = Regex("^\\d{9}$")
    val NISS = Regex("^\\d{11}$")
    val PHONE = Regex("^\\d{7,15}$")
    val POSTAL_CODE = Regex("^\\d{4}-\\d{3}$")
    val EMAIL = Regex("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$")
    val NUMEROUTENTE = Regex("^\\d{9}$")
    val BI = Regex("^\\d{8}$")
}
