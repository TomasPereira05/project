package pt.isel.jagoz.http.model.athlete

import kotlinx.datetime.LocalDate
import pt.isel.jagoz.service.AthleteUpdateInput

/**
 * Body do endpoint `PUT /api/athletes/{athleteId}/edit`.
 *
 * Update administrativo dos campos editáveis do atleta. Inclui os dados pessoais (que
 * vivem no Member) e os dados do Athlete — o service grava ambos numa só transacção. A
 * categoria muda via endpoint dedicado `/team-category`. Se `guardians` vier não-nulo,
 * substitui o conjunto inteiro (delete-all + insert). As datas chegam como strings
 * ISO-8601 (`YYYY-MM-DD`) e são parseadas no mapper.
 */
data class AthleteUpdateRequest(
    // Dados pessoais (Member)
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
    // Quota mensal do atleta em cêntimos (editável pelo admin).
    val membershipQuota: Int,
    // Dados pessoais (Athlete)
    val nationality: String,
    val niss: String,
    val numeroUtente: String,
    val bi: String,
    val biExpirationDate: String,
    // Dados desportivos / escolares
    val jerseyNumber: Int?,
    val position: String?,
    val school: String?,
    val schoolYear: String?,
    val schoolClass: String?,
    val lastClub: String?,
    val season: String?,
    val hasFamilyInClub: Boolean,
    val guardians: List<GuardianInput>? = null,
)

fun AthleteUpdateRequest.toUpdateInput(): AthleteUpdateInput =
    AthleteUpdateInput(
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
        membershipQuota = membershipQuota,
        nationality = nationality,
        niss = niss,
        numeroUtente = numeroUtente,
        bi = bi,
        biExpirationDate = LocalDate.parse(biExpirationDate),
        jerseyNumber = jerseyNumber,
        position = position,
        school = school,
        schoolYear = schoolYear,
        schoolClass = schoolClass,
        lastClub = lastClub,
        season = season,
        hasFamilyInClub = hasFamilyInClub,
        guardians = guardians?.map { it.toServiceInput() },
    )
