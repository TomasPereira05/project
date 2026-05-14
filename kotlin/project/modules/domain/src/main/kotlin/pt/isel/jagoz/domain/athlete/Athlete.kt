package pt.isel.jagoz.domain.athlete

import kotlinx.datetime.LocalDate
import pt.isel.jagoz.domain.team.TeamCategory

/**
 * Estado actual de um atleta no clube. Os dados pessoais (nome, data de nascimento,
 * morada, contactos, NIF, naturalidade) vivem no [pt.isel.jagoz.domain.member.Member]
 * associado por [memberId] — Atleta É sempre Sócio (categoria ATLETA_SOCIO).
 */
data class Athlete(
    val athleteId: Long,
    val memberId: Long,
    val nationality: String,
    // Número de Identificação da Segurança Social
    val niss: String,
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
    // Atribuído pós-inscrição pelo treinador
    val jerseyNumber: Int? = null,
    // Atribuída pós-inscrição pelo treinador
    val position: String? = null,
    // Referência ao ficheiro da foto (upload fora de scope nesta fase)
    val photoUrl: String? = null,
    /**
     * Declaração feita pelo encarregado no momento da inscrição: "tem mais filhos
     * a frequentar o clube?". Snapshot — não é actualizado automaticamente quando
     * outros membros da família entram ou saem do clube.
     */
    val hasFamilyInClub: Boolean = false,
    val schoolCertificationAccepted: Boolean = false,
    // Se ainda é atleta ativo do clube
    val active: Boolean = true,
    val guardians: List<Guardian> = emptyList(),
)
