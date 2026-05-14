package pt.isel.jagoz.http.model.athlete

import kotlinx.datetime.LocalDate
import pt.isel.jagoz.domain.athlete.Athlete
import pt.isel.jagoz.domain.member.Member

/**
 * Representação pública (não-autenticada) do perfil individual de um atleta.
 *
 * Consumido por: `GET /api/athletes/{id}`
 *
 * Inclui dados públicos do atleta sem expor a data de nascimento exacta (apenas
 * a idade calculada) — decisão de privacidade. NIF/BI/NISS/morada/contactos/guardians
 * ficam de fora; quem precisa disso usa o endpoint admin.
 *
 * TODO: `epocasRepresentadas` actualmente devolve apenas a época corrente do atleta
 *       (o domínio não tem histórico). Para histórico verdadeiro é preciso uma tabela
 *       `athlete_season_history`. Mantemos `List<String>` para não partir o frontend
 *       quando isso for adicionado.
 */
data class AthleteDetailDto(
    val id: Long,
    val nome: String,
    val numero: Int?,
    val posicao: String?,
    val nacionalidade: String,
    val idade: Int?,
    val fotoUrl: String?,
    val teamCategoryCode: String,
    val teamCategoryLabel: String,
    val epocasRepresentadas: List<String>,
)

fun Athlete.toDetailDto(
    member: Member,
    today: LocalDate,
): AthleteDetailDto =
    AthleteDetailDto(
        id = athleteId,
        nome = member.completeName,
        numero = jerseyNumber,
        posicao = position,
        nacionalidade = nationality,
        idade = calculateAge(member.birthDate, today),
        fotoUrl = photoUrl,
        teamCategoryCode = teamCategory.code,
        teamCategoryLabel = teamCategory.label,
        epocasRepresentadas = listOfNotNull(season),
    )

/** Idade em anos completos. Partilhado por DTOs públicos. */
internal fun calculateAge(
    birthDate: LocalDate,
    today: LocalDate,
): Int {
    var age = today.year - birthDate.year
    val notHadBirthdayYet =
        today.monthNumber < birthDate.monthNumber ||
            (today.monthNumber == birthDate.monthNumber && today.dayOfMonth < birthDate.dayOfMonth)
    if (notHadBirthdayYet) age--
    return age
}
