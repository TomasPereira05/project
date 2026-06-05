package pt.isel.jagoz.http.model.sponsor

import pt.isel.jagoz.domain.sponsor.Sponsor
import pt.isel.jagoz.domain.user.User

data class SponsorOutput(
    val sponsorId: Long,
    val name: String,
    val email: String,
    val phone: String,
    val nif: String,
    val userId: Long?,
    val accountUsername: String?,
)

fun Sponsor.toOutput(user: User? = null): SponsorOutput =
    SponsorOutput(
        sponsorId = sponsorId,
        name = name,
        email = email,
        phone = phone,
        nif = nif,
        userId = userId,
        accountUsername = user?.username,
    )
