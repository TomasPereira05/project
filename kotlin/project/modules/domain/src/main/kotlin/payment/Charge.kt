package pt.isel.payment

import kotlinx.datetime.LocalDate
import pt.isel.user.User

data class Charge(
    val chargeId: Long,
    val type: ChargeType,
    // se o ChargeType for MEMBER_FEE, id desse member fica aqui
    val memberId: Long? = null,
    // se for sponsor, o id do sponsor fica aqui
    val sponsorshipId: Long? = null,
    // Valor em cêntimos (ex: 150 = 1.50€)
    val value: Int,
    val status: ChargeStatus,
    // melhor do que ter data: LocalDate, assim sabemos a mensalidade do mes que se ta a pagar e o mes da quota
    // "2025/2026"
    val season: String? = null,
    // 1..12
    val month: Int? = null,
    val createdAt: LocalDate,
    val creationUser: User,
    val chargeUser: User? = null,
    val paidAt: LocalDate? = null,
)
