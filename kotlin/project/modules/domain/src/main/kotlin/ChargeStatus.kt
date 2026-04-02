package pt.isel

enum class ChargeStatus {
    PAID,
    PENDING, //em dívida, podia ser IN_DEBT mas pra já PENDING porque está a espera de ser pago
    CANCELLED
}