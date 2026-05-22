package pt.isel.jagoz.http.model.member

import kotlinx.datetime.LocalDate
import pt.isel.jagoz.domain.member.Member
import pt.isel.jagoz.domain.member.MemberCategory
import pt.isel.jagoz.domain.member.MemberStatus

data class MemberUpdateInput(
    val completeName: String,
    val birthDate: String,
    val birthplace: String? = null,
    val email: String,
    val phone: String,
    val homePhone: String?,
    val address: String,
    val postalCode: String,
    val city: String,
    val nif: String,
    val category: MemberCategory,
    val formerMember: Boolean,
    val membershipQuota: Int,
    val billingLocation: String?,
    val privacyAccepted: Boolean,
    val comsAccepted: Boolean,
)

fun MemberUpdateInput.toCandidate(): Member =
    Member(
        memberId = 0,
        userId = null,
        memberNumber = 0,
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
        status = MemberStatus.PENDENTE,
        membershipQuota = membershipQuota,
        billingLocation = billingLocation,
        registrationDate = LocalDate.parse("9999-12-31"),
        approvalDate = null,
        privacyAccepted = privacyAccepted,
        comsAccepted = comsAccepted,
    )
