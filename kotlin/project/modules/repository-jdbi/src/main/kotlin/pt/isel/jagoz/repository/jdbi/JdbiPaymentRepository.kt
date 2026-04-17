package pt.isel.jagoz.repository.jdbi

import org.jdbi.v3.core.Handle
import pt.isel.jagoz.domain.payment.Payment
import pt.isel.jagoz.repository.PaymentRepository

class JdbiPaymentRepository(private val handle: Handle) : PaymentRepository {
    override fun findByChargeId(chargeId: Long): List<Payment> {
        return handle.createQuery("SELECT * FROM payment WHERE charge_id = :chargeId ORDER BY created_at DESC")
            .bind("chargeId", chargeId)
            .mapTo(Payment::class.java)
            .list()
    }

    override fun save(payment: Payment): Long {
        return handle.createUpdate(
            """
            INSERT INTO payment (charge_id, amount, provider, provider_ref, status, created_at, confirmed_at)
            VALUES (:chargeId, :amount, :provider, :providerRef, CAST(:status AS payment_status), CAST(:createdAt AS TIMESTAMP), CAST(:confirmedAt AS TIMESTAMP))
            """,
        )
            .bind("chargeId", payment.chargeId)
            .bind("amount", payment.amount)
            .bind("provider", payment.provider)
            .bind("providerRef", payment.providerRef)
            .bind("status", payment.status.name)
            .bind("createdAt", payment.createdAt.toString())
            .bind("confirmedAt", payment.confirmedAt?.toString())
            .executeAndReturnGeneratedKeys()
            .mapTo(Long::class.java)
            .one()
    }

    override fun update(payment: Payment) {
        handle.createUpdate(
            """
            UPDATE payment SET 
                charge_id = :chargeId,
                amount = :amount,
                provider = :provider,
                provider_ref = :providerRef,
                status = CAST(:status AS payment_status),
                created_at = CAST(:createdAt AS TIMESTAMP),
                confirmed_at = CAST(:confirmedAt AS TIMESTAMP)
            WHERE payment_id = :id
            """,
        )
            .bind("id", payment.paymentId)
            .bind("chargeId", payment.chargeId)
            .bind("amount", payment.amount)
            .bind("provider", payment.provider)
            .bind("providerRef", payment.providerRef)
            .bind("status", payment.status.name)
            .bind("createdAt", payment.createdAt.toString())
            .bind("confirmedAt", payment.confirmedAt?.toString())
            .execute()
    }
}
