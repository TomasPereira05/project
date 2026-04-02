package pt.isel

import kotlinx.datetime.LocalDate

data class Charge(
    val chargeId: Long,
    val type: ChargeType,
    val memberId: Long? = null,                 //se o ChargeType for MEMBER_FEE, id desse member fica aqui
    val sponsorshipId: Long? = null,            // se for sponsor, o id do sponsor fica aqui
    val value: Double,
    val status: ChargeStatus,
    //melhor do que ter data: LocalDate, assim sabemos a mensalidade do mes que se ta a pagar e o mes da quota
    val season: String? = null,  // "2025/2026"
    val month: Int? = null,      // 1..12
    val createdAt: LocalDate,
    val paidAt: LocalDate? = null,
)
