package pt.isel.jagoz.http.model.event

import kotlinx.datetime.LocalDate
import pt.isel.jagoz.domain.event.TicketPriceType
import pt.isel.jagoz.service.EventDraft
import pt.isel.jagoz.service.SectorDraft
import pt.isel.jagoz.service.TicketPurchaseDraft
import pt.isel.jagoz.service.TicketPurchaseLine

data class SectorInput(
    // null = setor novo; preenchido = setor existente a atualizar
    val sectorId: Long? = null,
    val name: String,
    val capacity: Int,
)

data class EventCreateInput(
    val name: String,
    val description: String,
    // data/hora LOCAL (Europe/Lisbon) vinda de <input datetime-local>, ex.: "2027-01-01T20:00"
    val startsAt: String,
    val location: String,
    // preços em cêntimos
    val priceNormal: Int,
    val priceMember: Int,
    val sectors: List<SectorInput>,
)

data class EventUpdateInput(
    val name: String,
    val description: String,
    val startsAt: String,
    val location: String,
    val priceNormal: Int,
    val priceMember: Int,
    val sectors: List<SectorInput>,
)

fun SectorInput.toDraft() = SectorDraft(sectorId = sectorId, name = name, capacity = capacity)

fun EventCreateInput.toDraft() =
    EventDraft(
        name = name,
        description = description,
        startsAtLocal = startsAt,
        location = location,
        priceNormal = priceNormal,
        priceMember = priceMember,
        sectors = sectors.map { it.toDraft() },
    )

fun EventUpdateInput.toDraft() =
    EventDraft(
        name = name,
        description = description,
        startsAtLocal = startsAt,
        location = location,
        priceNormal = priceNormal,
        priceMember = priceMember,
        sectors = sectors.map { it.toDraft() },
    )

// ---- compra de bilhetes (público) ----

data class TicketLineInput(
    val sectorId: Long,
    // "NORMAL" | "MEMBER"
    val priceType: String,
    // preenchidos só para MEMBER em compra anónima (autenticado resolve pela sessão)
    val memberNumber: Int? = null,
    // ISO "yyyy-MM-dd"
    val memberBirthDate: String? = null,
)

data class EventCheckoutInput(
    val buyerName: String,
    val buyerEmail: String,
    val lines: List<TicketLineInput>,
)

fun TicketLineInput.toLine() =
    TicketPurchaseLine(
        sectorId = sectorId,
        priceType = if (priceType.equals("MEMBER", ignoreCase = true)) TicketPriceType.MEMBER else TicketPriceType.NORMAL,
        memberNumber = memberNumber,
        memberBirthDate = memberBirthDate?.let { runCatching { LocalDate.parse(it) }.getOrNull() },
    )

fun EventCheckoutInput.toDraft() =
    TicketPurchaseDraft(
        buyerName = buyerName,
        buyerEmail = buyerEmail,
        lines = lines.map { it.toLine() },
    )

data class MemberCredentialInput(
    val memberNumber: Int,
    // ISO "yyyy-MM-dd"
    val memberBirthDate: String,
)
