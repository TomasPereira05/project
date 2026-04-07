package pt.isel

import pt.isel.payment.Payment

interface PaymentRepository {
    fun findByChargeId(chargeId: Long): List<Payment>

    fun save(payment: Payment): Long

    fun update(payment: Payment)
}
