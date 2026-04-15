package pt.isel.jagoz.member

import kotlinx.datetime.LocalDate

/**
 * Represents a club member and their registration information.
 *
 * Fields are immutable; use domain operations in [MemberDomain] to perform
 * state transitions (approve, reject, deactivate, reactivate, etc.).
 */
data class Member(
    val memberId: Long,
    // Número sequencial único (1, 2, 3...)
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
    val category: MemberCategory,
    val formerMember: Boolean,
    // PENDENTE, ATIVO, INATIVO, REJEITADO
    val status: MemberStatus,
    // Quota mensal do sócio em cêntimos (ex: 150 = 1.50€)
    // SOCIO: mínimo 150 cêntimos (1.50€)
    // ATLETA_SOCIO: 0 cêntimos (não paga quota de sócio)
    val membershipQuota: Int = 150,
    // Local de cobrança
    val billingLocation: String?,
    val registrationDate: LocalDate,
    // Aprovação pelos diretores (null = pendente)
    val approvalDate: LocalDate? = null,
    val privacyAccepted: Boolean = false,
    val comsAccepted: Boolean = false,
)
