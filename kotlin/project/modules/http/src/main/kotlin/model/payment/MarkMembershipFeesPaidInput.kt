package pt.isel.jagoz.http.model.payment

data class MarkMembershipFeesPaidInput(
    val membershipFees: List<MembershipFeeSelectionInput>,
)
