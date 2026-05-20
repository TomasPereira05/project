package pt.isel.jagoz.http.model.payment

import pt.isel.jagoz.service.MembershipFeeSelection

data class MembershipFeeSelectionInput(
    val season: String,
    val month: Int,
)

data class CreateCheckoutSessionInput(
    val chargeId: Long? = null,
    val sponsorshipId: Long? = null,
    val memberId: Long? = null,
    val membershipFees: List<MembershipFeeSelectionInput>? = null,
)

fun MembershipFeeSelectionInput.toService() =
    MembershipFeeSelection(
        season = season,
        month = month,
    )
