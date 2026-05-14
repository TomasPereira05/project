package pt.isel.jagoz.http.model.athlete

import kotlinx.datetime.LocalDate
import pt.isel.jagoz.domain.athlete.Athlete
import pt.isel.jagoz.domain.member.Member

/**
 * Representação pública (não-autenticada) de um atleta para listagens por categoria.
 *
 * Consumido por: `GET /api/teams/{category}/athletes`
 *
 * Inclui apenas dados não-sensíveis. Não expõe NIF, BI, NISS, contactos, morada,
 * data de nascimento, guardians, nem o estado de consentimentos. Expõe `idade`
 * calculada (em anos completos), tal como o detalhe público — para a UI conseguir
 * mostrar o card de atleta com idade.
 */
data class AthletePublicDto(
    val id: Long,
    val nome: String,
    val numero: Int?,
    val posicao: String?,
    val nacionalidade: String,
    val idade: Int?,
    val teamCategoryCode: String,
    val teamCategoryLabel: String,
    val fotoUrl: String?,
)

fun Athlete.toPublicDto(member: Member, today: LocalDate): AthletePublicDto =
    AthletePublicDto(
        id = athleteId,
        nome = member.completeName,
        numero = jerseyNumber,
        posicao = position,
        nacionalidade = nationality,
        idade = calculateAge(member.birthDate, today),
        teamCategoryCode = teamCategory.code,
        teamCategoryLabel = teamCategory.label,
        fotoUrl = photoUrl,
    )
