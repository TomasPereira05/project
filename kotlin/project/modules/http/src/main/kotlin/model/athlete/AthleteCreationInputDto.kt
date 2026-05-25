package pt.isel.jagoz.http.model.athlete

import kotlinx.datetime.LocalDate
import pt.isel.jagoz.service.AthleteRegistrationInput

/**
 * Body do endpoint de inscrição de atleta.
 *
 * Consumido por: `POST /api/athletes`
 *
 * Espelha o formulário em papel: dados pessoais (vão para Member), dados atléticos
 * (vão para Athlete) e lista de guardians. As datas chegam como strings ISO-8601
 * (`YYYY-MM-DD`) e são parseadas para `LocalDate` no mapper.
 *
 * O service (`AthleteService.registerAthlete`) cria Member + Athlete + Guardians
 * numa só transacção — ver `project_athlete_member_relationship.md`.
 */
data class AthleteCreationInputDto(
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
    // Agregado familiar
    val guardians: List<GuardianInputDto>,
    /**
     * `true` quando o user autenticado se está a inscrever a si próprio. Nesse caso o
     * controller liga `member.user_id` à conta autenticada. Quando `false` (por defeito),
     * o Member fica sem `user_id` — caso típico de inscrição em nome de familiares ou de
     * inscrição feita por ADMIN/SECRETARIA.
     */
    val isSelfRegistration: Boolean = false,
)

/**
 * Converte o DTO HTTP no input do service. `userId` vem do `AuthenticatedUser`
 * (o controller obtém-no via argument resolver) e `registrationDate` é gerada
 * pelo controller no momento do pedido.
 */
fun AthleteCreationInputDto.toRegistrationInput(
    userId: Long?,
    registrationDate: LocalDate,
): AthleteRegistrationInput =
    AthleteRegistrationInput(
        userId = userId,
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
