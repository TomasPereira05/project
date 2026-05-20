package pt.isel.jagoz.repository

import pt.isel.jagoz.domain.payment.ChargeItem
import pt.isel.jagoz.domain.payment.ChargeItemWithStatus

interface ChargeItemRepository {
    fun findByChargeId(chargeId: Long): List<ChargeItem>

    fun findByMember(memberId: Long): List<ChargeItem>

    fun findWithStatusByMember(memberId: Long): List<ChargeItemWithStatus>

    fun existsPaidOrPending(
        memberId: Long,
        season: String,
        month: Int,
    ): Boolean

    fun save(item: ChargeItem): Long
}
