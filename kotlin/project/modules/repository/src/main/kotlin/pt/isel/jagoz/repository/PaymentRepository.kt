package pt.isel.jagoz.repository

import pt.isel.jagoz.payment.Payment

interface PaymentRepository {
    fun findByChargeId(chargeId: Long): List<Payment>

    fun save(payment: Payment): Long

    fun update(payment: Payment)
}
