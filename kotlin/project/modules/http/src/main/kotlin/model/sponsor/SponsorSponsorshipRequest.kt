package pt.isel.jagoz.http.model.sponsor

import pt.isel.jagoz.domain.sponsor.Sponsor
import pt.isel.jagoz.domain.sponsor.Sponsorship

data class SponsorSponsorshipRequest(
    val sponsor: Sponsor,
    val sponsorship: Sponsorship,
)
