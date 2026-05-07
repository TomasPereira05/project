package pt.isel.jagoz.domain.athlete

import kotlinx.datetime.LocalDate
import pt.isel.jagoz.domain.team.TeamCategory

data class Athlete(
    val athleteId: Long,
    // FK â†’ Member (todo atleta Ã© sÃ³cio)
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
    // NÃºmero de IdentificaÃ§Ã£o da SeguranÃ§a Social
    val niss: String,
    // NÃºmero de IdentificaÃ§Ã£o Fiscal
    val nif: String,
    // NÃºmero de Utente da SaÃºde
    val numeroUtente: String,
    // Bilhete de Identidade / CartÃ£o de CidadÃ£o
    val bi: String,
    // Data de expiraÃ§Ã£o do BI/CC
    val biExpirationDate: LocalDate,
    val school: String?,
    val schoolYear: String?,
    val schoolClass: String?,
    val lastClub: String?,
    // Ã‰poca desportiva (ex: "2025/2026")
    val season: String?,
    // EscalÃ£o em que joga
    val teamCategory: TeamCategory,
    // Se ainda Ã© atleta ativo do clube
    val active: Boolean = true,
    val privacyAccepted: Boolean = false,
    val comsAccepted: Boolean = false,
    val schoolCertificationAccepted: Boolean = false,
    val guardians: List<Guardian> = emptyList(),
)
