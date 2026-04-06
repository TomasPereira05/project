package pt.isel.member

data class MemberConsent(
    val memberConsentId: Long,
    val memberId: Long,
    val privacyAccepted: Boolean,
    val comsAccepted: Boolean,
)