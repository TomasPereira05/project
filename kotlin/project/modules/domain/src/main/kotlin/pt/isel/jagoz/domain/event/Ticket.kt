package pt.isel.jagoz.domain.event

import kotlinx.datetime.Instant

data class Ticket(
    val ticketId: Long,
    val eventId: Long,
    val sectorId: Long,
    // ligação à compra (charge TICKET_PURCHASE); null enquanto reservado sem charge
    val chargeId: Long?,
    // sempre preenchido para priceType=MEMBER (ver EventDomain.validateTicketForPurchase)
    val memberId: Long? = null,
    val memberNumber: Int? = null,
    val priceType: TicketPriceType,
    val price: Int,
    val buyerEmail: String,
    val buyerName: String,
    val status: TicketStatus = TicketStatus.RESERVED,
    // atribuído apenas na confirmação do pagamento
    val qrCode: String? = null,
    // instante da validação à porta (coluna TIMESTAMPTZ); null enquanto não usado
    val usedAt: Instant? = null,
)
