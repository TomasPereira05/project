package pt.isel

import kotlinx.datetime.LocalDate

data class Athlete(
    val athleteId: Long,
    val completeName: String,
    val birthDate: LocalDate,
    val nationality: String, // Tambem tem um campo de naturalidade, mas nao sei tenho que ir ver qual é a diferença
    val niss: String, // Numero de Identificação da Segurança Social
    val nif: String, // Número de Identificação Fiscal
    val numeroUtente: String, // Número de Utente da Saúde
    val expirationDate: LocalDate,
    val bi: String, // Bilhete de Identidade
    val email: String,
    val phone: String,
    val address: String,
    val postalCode: String,
    val city: String,
    val school: String?,
    val schoolyear: String?,
    val schoolclass: String?,
    val lastclub: String?,
    val season: String?,
    val hasfamilyinClub: Boolean,
)
