package pt.isel

import kotlinx.datetime.LocalDate

data class Member(
    val memberId: Long,
    val completeName: String,
    val birthDate: String,
    val memberNumber: String,
    val email: String,
    val phone: String,
    val homePhone: String,
    val address: String,
    val postalCode: String,
    val city: String,
    val registrationData: LocalDate,
)
