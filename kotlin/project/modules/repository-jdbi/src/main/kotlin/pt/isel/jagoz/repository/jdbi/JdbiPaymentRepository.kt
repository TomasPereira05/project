package pt.isel.jagoz.repository.jdbi

import org.jdbi.v3.core.Handle
import pt.isel.jagoz.domain.payment.Payment
import pt.isel.jagoz.repository.PaymentRepository

class JdbiPaymentRepository(
    private val handle: Handle,
) : PaymentRepository {
    override fun findByChargeId(chargeId: Long): List<Payment> =
        handle
            .createQuery("SELECT * FROM jagoz.payment WHERE charge_id = :chargeId ORDER BY created_at DESC")
            .bind("chargeId", chargeId)
            .mapTo(Payment::class.java)
            .list()

    override fun findByProviderRef(provider: String, providerRef: String): Payment? =
        handle
            .createQuery("SELECT * FROM jagoz.payment WHERE provider = :provider AND provider_ref = :providerRef")
            .bind("provider", provider)
            .bind("providerRef", providerRef)
            .mapTo(Payment::class.java)
            .findOne()
            .orElse(null)

    override fun save(payment: Payment): Long =
        handle
            .createUpdate(
                """
            INSERT INTO jagoz.payment (charge_id, amount, provider, provider_ref, status, created_at, confirmed_at)
            VALUES (:chargeId, :amount, :provider, :providerRef, CAST(:status AS jagoz.payment_status), :createdAt, :confirmedAt)
            """,
            ).bind("chargeId", payment.chargeId)
            .bind("amount", payment.amount)
            .bind("provider", payment.provider)
            .bind("providerRef", payment.providerRef)
            .bind("status", payment.status.name)
            .bind("createdAt", payment.createdAt)
            .bind("confirmedAt", payment.confirmedAt)
            .executeAndReturnGeneratedKeys()
            .mapTo(Long::class.java)
            .one()

    override fun update(payment: Payment) {
        handle
            .createUpdate(
                """
            UPDATE jagoz.payment SET 
                charge_id = :chargeId,
                amount = :amount,
                provider = :provider,
                provider_ref = :providerRef,
                status = CAST(:status AS jagoz.payment_status),
                created_at = :createdAt,
                confirmed_at = :confirmedAt
            WHERE payment_id = :id
            """,
            ).bind("id", payment.paymentId)
            .bind("chargeId", payment.chargeId)
            .bind("amount", payment.amount)
            .bind("provider", payment.provider)
            .bind("providerRef", payment.providerRef)
            .bind("status", payment.status.name)
            .bind("createdAt", payment.createdAt)
            .bind("confirmedAt", payment.confirmedAt)
            .execute()
    }
}
