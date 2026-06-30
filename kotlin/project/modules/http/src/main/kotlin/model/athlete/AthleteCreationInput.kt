package pt.isel.jagoz.http.model.athlete

import kotlinx.datetime.LocalDate
import pt.isel.jagoz.service.AthleteRegistrationInput

data class AthleteCreationInput(
    // Dados pessoais (vão para Member)
    val completeName: String,
    val birthDate: String,
    val birthplace: String?,
    val email: String,
    val phone: String,
    val homePhone: String?,
    val address: String,
    val postalCode: String,
    val city: String,
    val nif: String,
    val privacyAccepted: Boolean,
    val comsAccepted: Boolean,
    // Dados atléticos
    val nationality: String,
    val niss: String,
    val numeroUtente: String,
    val bi: String,
    val biExpirationDate: String,
    val school: String?,
    val schoolYear: String?,
    val schoolClass: String?,
    val lastClub: String?,
    val season: String?,
    val teamCategoryId: Long,
    val hasFamilyInClub: Boolean,
    val schoolCertificationAccepted: Boolean,
    val guardians: List<GuardianInput>,
    val isSelfRegistration: Boolean = false,
)

fun AthleteCreationInput.toRegistrationInput(
    userId: Long?,
    creatorUserId: Long?,
    registrationDate: LocalDate,
): AthleteRegistrationInput =
    AthleteRegistrationInput(
        userId = userId,
        creatorUserId = creatorUserId,
        completeName = completeName,
        birthDate = LocalDate.parse(birthDate),
        birthplace = birthplace,
        email = email,
        phone = phone,
        homePhone = homePhone,
        address = address,
        postalCode = postalCode,
        city = city,
        nif = nif,
        privacyAccepted = privacyAccepted,
        comsAccepted = comsAccepted,
        registrationDate = registrationDate,
        nationality = nationality,
        niss = niss,
        numeroUtente = numeroUtente,
        bi = bi,
        biExpirationDate = LocalDate.parse(biExpirationDate),
        school = school,
        schoolYear = schoolYear,
        schoolClass = schoolClass,
        lastClub = lastClub,
        season = season,
        teamCategoryId = teamCategoryId,
        hasFamilyInClub = hasFamilyInClub,
        schoolCertificationAccepted = schoolCertificationAccepted,
        guardians = guardians.map { it.toServiceInput() },
    )
