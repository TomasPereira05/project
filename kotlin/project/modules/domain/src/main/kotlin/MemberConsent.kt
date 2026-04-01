package pt.isel

import kotlinx.datetime.LocalDate

data class MemberConsent(
    val memberConsentId: Long,
    val memberId: Long,
    val privacyAccepted: Boolean,
    val comsAccepted: Boolean,
)
