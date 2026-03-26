package pt.isel

import kotlinx.datetime.LocalDate

data class Quota (
    val quotaId: Long,
    val memberId: Long,
    val value: Double,
    val data: LocalDate,
    val paid: Boolean
)