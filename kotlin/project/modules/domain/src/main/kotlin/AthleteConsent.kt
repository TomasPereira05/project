package pt.isel

data class AthleteConsent(
    val athleteConsentId: Long,
    val athleteId: Long,
    val privacyAccepted: Boolean,
    val comsAccepted: Boolean,
    val scholarInformationAccepted: Boolean,
    val consentDate: String
)
