package pt.isel.jagoz.domain.payment

enum class ChargeStatus {
    PAID,
    PENDING, // em dÃ­vida, podia ser IN_DEBT mas pra jÃ¡ PENDING porque estÃ¡ a espera de ser pago
    CANCELLED,
}
