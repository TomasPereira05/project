package pt.isel.jagoz.http.model.athlete

import pt.isel.jagoz.domain.athlete.Guardian
import pt.isel.jagoz.domain.athlete.GuardianRole
import pt.isel.jagoz.service.GuardianInput

/**
 * Representação completa de um Guardian, incluindo contactos.
 *
 * Consumido por: `AthleteAdminDto` (endpoints admin). Não deve aparecer em
 * endpoints públicos — contém email/telefone do encarregado.
 */
data class GuardianDto(
    val guardianId: Long,
    val name: String,
    val role: GuardianRole,
    val kinship: String?,
    val email: String,
    val phone: String,
    val professionalActivity: String?,
    val contactPhone: String?,
)

fun Guardian.toDto(): GuardianDto =
    GuardianDto(
        guardianId = guardianId,
        name = name,
        role = role,
        kinship = kinship,
        email = email,
        phone = phone,
        professionalActivity = professionalActivity,
        contactPhone = contactPhone,
    )

/**
 * Input para criar/actualizar um Guardian. Usado por `AthleteCreationInputDto`
 * (na inscrição) e por endpoints de actualização administrativa.
 */
data class GuardianInputDto(
    val name: String,
    val role: GuardianRole,
    val kinship: String?,
    val email: String,
    val phone: String,
    val professionalActivity: String?,
    val contactPhone: String?,
    /**
     * Nº Sócio do encarregado (se for sócio). É o `memberNumber` user-facing —
     * o service resolve-o em `memberId` (FK) via `MemberRepository.findByMemberNumber`.
     */
    val memberNumber: Int? = null,
)

fun GuardianInputDto.toServiceInput(): GuardianInput =
    GuardianInput(
        name = name,
        role = role,
        kinship = kinship,
        email = email,
        phone = phone,
        professionalActivity = professionalActivity,
        contactPhone = contactPhone,
        memberNumber = memberNumber,
    )
