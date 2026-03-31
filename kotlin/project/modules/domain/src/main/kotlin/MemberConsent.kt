package pt.isel

import kotlinx.datetime.LocalDate

data class MemberConsent(
    val memberConsentId: Long,
    val memberId: Long,
    val date: LocalDate,
    val privacyAccepted: Boolean,
    val comsAccepted: Boolean,
    val scholarInformationAccepted: Boolean? = null, // Apenas usado se o Sócio for Atleta
)
