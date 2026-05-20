package pt.isel.jagoz.repository.jdbi.mappers

import kotlinx.datetime.Instant
import org.jdbi.v3.core.mapper.RowMapper
import org.jdbi.v3.core.statement.StatementContext
import pt.isel.jagoz.domain.payment.Payment
import pt.isel.jagoz.domain.payment.PaymentStatus
import java.sql.ResultSet

class PaymentMapper : RowMapper<Payment> {
    override fun map(
        rs: ResultSet,
        ctx: StatementContext,
    ): Payment =
        Payment(
            paymentId = rs.getLong("payment_id"),
            chargeId = rs.getLong("charge_id"),
            amount = rs.getInt("amount"),
            provider = rs.getString("provider"),
            providerRef = rs.getString("provider_ref"),
            status = PaymentStatus.valueOf(rs.getString("status")),
            createdAt = rs.getTimestamp("created_at").toInstant().let { Instant.fromEpochMilliseconds(it.toEpochMilli()) },
            confirmedAt = rs.getTimestamp("confirmed_at")?.toInstant()?.let { Instant.fromEpochMilliseconds(it.toEpochMilli()) },
        )
}
