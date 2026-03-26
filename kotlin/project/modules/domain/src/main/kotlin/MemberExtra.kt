package pt.isel

data class MemberExtra(
    val id: Long,
    val memberId: Long,
    val monthlyQuota: Double,
    val hasBeenMemberBefore: Boolean,
    val billingLocation: String,
)
