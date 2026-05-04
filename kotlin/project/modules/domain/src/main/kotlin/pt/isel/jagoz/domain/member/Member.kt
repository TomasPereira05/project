package pt.isel.jagoz.domain.member

import kotlinx.datetime.LocalDate

/**
 * Represents a club member and their registration information.
 *
 * Fields are immutable; use domain operations in [MemberDomain] to perform
 * state transitions (approve, reject, deactivate, reactivate, etc.).
 */
data class Member(
    val memberId: Long,
    // NÃºmero sequencial Ãºnico (1, 2, 3...)
    val memberNumber: Int,
    val completeName: String,
    val birthDate: LocalDate,
    val email: String,
    val phone: String,
    val homePhone: String?,
    val address: String,
    val postalCode: String,
    val city: String,
    // SOCIO ou ATLETA_SOCIO
    val nif: String,
    val category: MemberCategory,
    val formerMember: Boolean,
    // PENDENTE, ATIVO, INATIVO, REJEITADO
    val status: MemberStatus,
    // Quota mensal do sÃ³cio em cÃªntimos (ex: 150 = 1.50â‚¬)
    // SOCIO: mÃ­nimo 150 cÃªntimos (1.50â‚¬)
    // ATLETA_SOCIO: 0 cÃªntimos (nÃ£o paga quota de sÃ³cio)
    val membershipQuota: Int = 150,
    // Local de cobranÃ§a
    val billingLocation: String?,
    val registrationDate: LocalDate,
    // AprovaÃ§Ã£o pelos diretores (null = pendente)
    val approvalDate: LocalDate? = null,
    val privacyAccepted: Boolean = false,
    val comsAccepted: Boolean = false,
)
