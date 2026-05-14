package pt.isel.jagoz.http.model.member

import kotlinx.datetime.LocalDate
import pt.isel.jagoz.domain.member.Member
import pt.isel.jagoz.domain.member.MemberCategory
import pt.isel.jagoz.domain.member.MemberStatus

data class MemberCreateInput(
    val memberId: Long,
    val userId: Long?,
    val memberNumber: Int,
    val completeName: String,
    val birthDate: String,
    val birthplace: String?,
    val email: String,
    val phone: String,
    val homePhone: String?,
    val address: String,
    val postalCode: String,
    val city: String,
    val nif: String,
    val category: MemberCategory,
    val formerMember: Boolean,
    val status: MemberStatus,
    val membershipQuota: Int,
    val billingLocation: String?,
    val registrationDate: String,
    val approvalDate: String?,
    val privacyAccepted: Boolean,
    val comsAccepted: Boolean
)

fun MemberCreateInput.toMember(): Member = Member(
    memberId = memberId,
    userId = userId,
    memberNumber = memberNumber,
    completeName = completeName,
    birthDate = LocalDate.parse(birthDate),
    birthplace = birthplace,
    email = email,
    phone = phone,
    homePhone = homePhone,
    address = address,
    postalCode = postalCode,
    city = city,
    nif = nif,
    category = category,
    formerMember = formerMember,
    status = status,
    membershipQuota = membershipQuota,
    billingLocation = billingLocation,
    registrationDate = LocalDate.parse(registrationDate),
    approvalDate = approvalDate?.let(LocalDate::parse),
    privacyAccepted = privacyAccepted,
    comsAccepted = comsAccepted,
)
