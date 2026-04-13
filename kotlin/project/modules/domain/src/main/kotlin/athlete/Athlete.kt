package pt.isel.jagoz.athlete

import kotlinx.datetime.LocalDate
import pt.isel.jagoz.sponsor.TeamCategory

data class Athlete(
    val athleteId: Long,
    // FK → Member (todo atleta é sócio)
    val memberId: Long,
    val nationality: String,
    val birthplace: String,
    val birthdate: LocalDate,
    val email: String,
    val phone: String,
    val postalCode: String,
    val address: String,
    val city: String,
    val state: String,
    // Número de Identificação da Segurança Social
    val niss: String,
    // Número de Identificação Fiscal
    val nif: String,
    // Número de Utente da Saúde
    val numeroUtente: String,
    // Bilhete de Identidade / Cartão de Cidadão
    val bi: String,
    // Data de expiração do BI/CC
    val biExpirationDate: LocalDate,
    val school: String?,
    val schoolYear: String?,
    val schoolClass: String?,
    val lastClub: String?,
    // Época desportiva (ex: "2025/2026")
    val season: String?,
    // Escalão em que joga
    val teamCategory: TeamCategory,
    // Se ainda é atleta ativo do clube
    val active: Boolean = true,
    val privacyAccepted: Boolean = false,
    val comsAccepted: Boolean = false,
    val schoolCertificationAccepted: Boolean = false,
    val guardians: List<Guardian> = emptyList(),
)
