package pt.isel.athlete

import kotlinx.datetime.LocalDate
import pt.isel.sponsor.TeamCategory

data class Athlete(
    val athleteId: Long,
    val memberId: Long, // FK → Member (todo atleta é sócio)
    val nationality: String,
    val birthplace: String,
    val birthdate: LocalDate,
    val email: String,
    val phone: String,
    val postalCode: String,
    val adress: String,
    val city: String,
    val state: String,
    val niss: String, // Número de Identificação da Segurança Social
    val nif: String, // Número de Identificação Fiscal
    val numeroUtente: String, // Número de Utente da Saúde
    val bi: String, // Bilhete de Identidade / Cartão de Cidadão
    val biExpirationDate: LocalDate, // Data de expiração do BI/CC
    val school: String?,
    val schoolYear: String?,
    val schoolClass: String?,
    val lastClub: String?,
    val season: String?, // Época desportiva (ex: "2025/2026")
    val teamCategory: TeamCategory, // Escalão em que joga
    val active: Boolean = true, // Se ainda é atleta ativo do clube
    val privacyAccepted: Boolean = false,
    val comsAccepted: Boolean = false,
    val schoolCertificationAccepted: Boolean = false,
    val guardians: List<Guardian> = emptyList(),
)
