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
    val memberNumber: Int, // Número sequencial único (1, 2, 3...)
    val completeName: String,
    val birthDate: LocalDate,
    val email: String,
    val phone: String,
    val homePhone: String?,
    val address: String,
    val postalCode: String,
    val city: String,
    val category: MemberCategory, // SOCIO ou ATLETA_SOCIO
    val formerMember: Boolean,
    val status: MemberStatus, // PENDENTE, ATIVO, INATIVO, REJEITADO
    val monthlyQuota: Double, // Mínimo 1.5€ (0.0 para atletas ativos)
    val billingLocation: String?, // Local de cobrança
    val registrationDate: LocalDate,
    val approvalDate: LocalDate? = null, // Aprovação pelos diretores (null = pendente)
    val privacyAccepted: Boolean,
    val comsAccepted: Boolean,
)
