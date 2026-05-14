package pt.isel.jagoz.http.model.member

import pt.isel.jagoz.domain.member.Member

data class MemberOutput(
    val memberId: Long,
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
    val category: String,
    val formerMember: Boolean,
    val status: String,
    val membershipQuota: Int,
    val billingLocation: String?,
    val registrationDate: String,
    val approvalDate: String?,
    val privacyAccepted: Boolean,
    val comsAccepted: Boolean,
)

fun Member.tooutput() =
    MemberOutput(
        memberId = memberId,
        memberNumber = memberNumber,
        completeName = completeName,
        birthDate = birthDate.toString(),
        birthplace = birthplace,
        email = email,
        phone = phone,
        homePhone = homePhone,
        address = address,
        postalCode = postalCode,
        city = city,
        nif = nif,
        category = category.name,
        formerMember = formerMember,
        status = status.name,
        membershipQuota = membershipQuota,
        billingLocation = billingLocation,
        registrationDate = registrationDate.toString(),
        approvalDate = approvalDate?.toString(),
        privacyAccepted = privacyAccepted,
        comsAccepted = comsAccepted,
    )
