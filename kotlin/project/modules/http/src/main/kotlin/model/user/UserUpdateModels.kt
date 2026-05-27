package pt.isel.jagoz.http.model.user

import pt.isel.jagoz.domain.user.Role

data class UpdateUserRoleRequest(
    val role: Role,
)

data class UpdateUserActiveMemberRequest(
    val memberId: Long?,
)

data class UserMemberAssociationOutput(
    val memberId: Long,
    val memberNumber: Int,
    val completeName: String,
    val email: String,
    val status: String,
)

data class UserAthleteAssociationOutput(
    val athleteId: Long,
    val memberId: Long,
    val teamCategory: String,
    val season: String?,
    val active: Boolean,
)

data class UserSponsorAssociationOutput(
    val sponsorId: Long,
    val name: String,
    val email: String,
    val phone: String,
    val nif: String,
)

data class UserAssociationsOutput(
    val member: UserMemberAssociationOutput?,
    val athlete: UserAthleteAssociationOutput?,
    val sponsors: List<UserSponsorAssociationOutput>,
)
