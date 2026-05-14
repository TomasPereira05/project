package pt.isel.jagoz.http.model.athlete

import pt.isel.jagoz.domain.athlete.Athlete
import pt.isel.jagoz.domain.member.Member
import pt.isel.jagoz.domain.member.MemberStatus
import pt.isel.jagoz.http.model.member.MemberOutput
import pt.isel.jagoz.http.model.member.tooutput

/**
 * Representação completa de um atleta para SECRETARIA / ADMIN.
 *
 * Consumido por: `GET /api/athletes` (lista admin) e `GET /api/athletes/{id}/admin`
 * (detalhe admin).
 *
 * Inclui todos os dados sensíveis: NIF/BI/NISS, contactos, morada (via `member`),
 * número de utente, guardians completos. Não retorna a entidade de domínio
 * directamente — campos derivados como `epocasRepresentadas` ficam consistentes
 * com `AthleteDetailDto`.
 */
data class AthleteAdminDto(
    val athleteId: Long,
    val member: MemberOutput,
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
    val teamCategoryCode: String,
    val teamCategoryLabel: String,
    val jerseyNumber: Int?,
    val position: String?,
    val photoUrl: String?,
    val hasFamilyInClub: Boolean,
    val schoolCertificationAccepted: Boolean,
    val active: Boolean,
    /**
     * Status visual derivado do par (Member.status, Athlete.active):
     *  - PENDENTE  : Member ainda não foi aprovado pela secretaria
     *  - REJEITADO : Member foi rejeitado
     *  - ATIVO     : Member aprovado e atleta a jogar (active=true)
     *  - INATIVO   : Member aprovado mas atleta marcado inactivo (ex-jogador)
     */
    val status: String,
    val guardians: List<GuardianDto>,
)

private fun deriveStatus(
    member: Member,
    athleteActive: Boolean,
): String =
    when (member.status) {
        MemberStatus.PENDENTE -> "PENDENTE"
        MemberStatus.REJEITADO -> "REJEITADO"
        MemberStatus.ATIVO -> if (athleteActive) "ATIVO" else "INATIVO"
        MemberStatus.INATIVO -> "INATIVO"
    }

fun Athlete.toAdminDto(member: Member): AthleteAdminDto =
    AthleteAdminDto(
        athleteId = athleteId,
        member = member.tooutput(),
        nationality = nationality,
        niss = niss,
        numeroUtente = numeroUtente,
        bi = bi,
        biExpirationDate = biExpirationDate.toString(),
        school = school,
        schoolYear = schoolYear,
        schoolClass = schoolClass,
        lastClub = lastClub,
        season = season,
        teamCategoryId = teamCategory.teamId,
        teamCategoryCode = teamCategory.code,
        teamCategoryLabel = teamCategory.label,
        jerseyNumber = jerseyNumber,
        position = position,
        photoUrl = photoUrl,
        hasFamilyInClub = hasFamilyInClub,
        schoolCertificationAccepted = schoolCertificationAccepted,
        active = active,
        status = deriveStatus(member, active),
        guardians = guardians.map { it.toDto() },
    )
