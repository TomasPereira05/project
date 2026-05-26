package pt.isel.jagoz.http.model.payment

import pt.isel.jagoz.domain.payment.ChargeStatus
import pt.isel.jagoz.service.MembershipFeeOption

data class MembershipFeeOptionOutput(
    val season: String,
    val month: Int,
    val amount: Int,
    val dueDate: String,
    val status: ChargeStatus?,
    val selectable: Boolean,
    val receiptPaymentId: Long?,
)

fun MembershipFeeOption.toOutput(): MembershipFeeOptionOutput =
    MembershipFeeOptionOutput(
        season = season,
        month = month,
        amount = amount,
        dueDate = dueDate.toString(),
        status = status,
        selectable = selectable,
        receiptPaymentId = receiptPaymentId,
    )
