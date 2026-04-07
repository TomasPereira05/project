package pt.isel.member

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
    // Mínimo 1.5€ (0.0 para atletas ativos)
    val monthlyQuota: Double,
    // Local de cobrança
    val billingLocation: String?,
    val registrationDate: LocalDate,
    // Aprovação pelos diretores (null = pendente)
    val approvalDate: LocalDate? = null,
    val privacyAccepted: Boolean = false,
    val comsAccepted: Boolean = false,
)
