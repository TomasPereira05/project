package pt.isel.jagoz.http.model.athlete

import pt.isel.jagoz.domain.athlete.Guardian
import pt.isel.jagoz.domain.athlete.GuardianRole
import pt.isel.jagoz.service.GuardianInput as GuardianServiceInput

data class GuardianOutput(
    val guardianId: Long,
    val name: String,
    val role: GuardianRole,
    val kinship: String?,
    val email: String,
    val phone: String,
    val professionalActivity: String?,
    val contactPhone: String?,
)

fun Guardian.toOutput(): GuardianOutput =
    GuardianOutput(
        guardianId = guardianId,
        name = name,
        role = role,
        kinship = kinship,
        email = email,
        phone = phone,
        professionalActivity = professionalActivity,
        contactPhone = contactPhone,
    )

data class GuardianInput(
    val name: String,
    val role: GuardianRole,
    val kinship: String?,
    val email: String,
    val phone: String,
    val professionalActivity: String?,
    val contactPhone: String?,
    val memberNumber: Int? = null,
)

fun GuardianInput.toServiceInput(): GuardianServiceInput =
    GuardianServiceInput(
        name = name,
        role = role,
        kinship = kinship,
        email = email,
        phone = phone,
        professionalActivity = professionalActivity,
        contactPhone = contactPhone,
        memberNumber = memberNumber,
    )
