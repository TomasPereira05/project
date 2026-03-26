package pt.isel

import kotlinx.datetime.LocalDate

data class MemberConsent(
    val MemberConsentId: Long,
    val memberId: Long,
    val date: LocalDate,
    val privacyAccepted: Boolean,
    val comsAccepted: Boolean,
)
