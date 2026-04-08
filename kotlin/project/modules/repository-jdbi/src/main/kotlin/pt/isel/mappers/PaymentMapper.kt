package pt.isel.mappers

import kotlinx.datetime.LocalDateTime
import pt.isel.payment.Payment
import pt.isel.payment.PaymentStatus
import java.sql.ResultSet

object PaymentMapper {
    fun map(rs: ResultSet): Payment =
        Payment(
            paymentId = rs.getLong("payment_id"),
            chargeId = rs.getLong("charge_id"),
            amount = rs.getDouble("amount"),
            provider = rs.getString("provider"),
            providerRef = rs.getString("provider_ref"),
            status = PaymentStatus.valueOf(rs.getString("status")),
            createdAt = LocalDateTime.parse(rs.getString("created_at").replace(" ", "T")),
            confirmedAt = rs.getString("confirmed_at")?.let { LocalDateTime.parse(it.replace(" ", "T")) },
        )
}

