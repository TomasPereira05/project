package pt.isel.jagoz.repository

import pt.isel.jagoz.domain.payment.Payment

interface PaymentRepository {
    fun findById(paymentId: Long): Payment?

    fun findByChargeId(chargeId: Long): List<Payment>

    fun findPaidBySponsorshipId(sponsorshipId: Long): Payment?

    fun findByProviderRef(
        provider: String,
        providerRef: String,
    ): Payment?

    fun save(payment: Payment): Long

    fun update(payment: Payment)
}
