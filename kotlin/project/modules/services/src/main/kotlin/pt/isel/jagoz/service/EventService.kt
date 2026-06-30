package pt.isel.jagoz.service

import jakarta.inject.Named
import kotlinx.datetime.Clock
import kotlinx.datetime.Instant
import kotlinx.datetime.LocalDate
import kotlinx.datetime.TimeZone
import kotlinx.datetime.toLocalDateTime
import pt.isel.jagoz.domain.event.Event
import pt.isel.jagoz.domain.event.EventDomain
import pt.isel.jagoz.domain.event.EventError
import pt.isel.jagoz.domain.event.EventListFilter
import pt.isel.jagoz.domain.event.EventSector
import pt.isel.jagoz.domain.event.EventStatus
import pt.isel.jagoz.domain.event.Ticket
import pt.isel.jagoz.domain.event.TicketPriceType
import pt.isel.jagoz.domain.event.TicketStatus
import pt.isel.jagoz.domain.member.Member
import pt.isel.jagoz.domain.member.MemberStatus
import pt.isel.jagoz.domain.payment.Charge
import pt.isel.jagoz.domain.payment.ChargeStatus
import pt.isel.jagoz.domain.payment.ChargeType
import pt.isel.jagoz.domain.payment.PaymentError
import pt.isel.jagoz.domain.user.AuthenticatedUser
import pt.isel.jagoz.domain.utils.Either
import pt.isel.jagoz.domain.utils.ValidationError
import pt.isel.jagoz.domain.utils.failure
import pt.isel.jagoz.domain.utils.success
import pt.isel.jagoz.repository.Transaction
import pt.isel.jagoz.repository.TransactionManager
import kotlin.time.Duration.Companion.hours

data class SectorDraft(
    val sectorId: Long?,
    val name: String,
    val capacity: Int,
)

data class EventDraft(
    val name: String,
    val description: String,
    // data/hora local (Europe/Lisbon) tal como escolhida pelo admin
    val startsAtLocal: String,
    val location: String,
    val priceNormal: Int,
    val priceMember: Int,
    val sectors: List<SectorDraft>,
)

data class EventWithSectors(
    val event: Event,
    val sectors: List<EventSector>,
)

data class TicketWithSector(
    val ticket: Ticket,
    val sectorName: String,
)

/** Resultado da leitura de um QR à porta. Só VALID consome o bilhete (CONFIRMED -> USED). */
enum class TicketValidationOutcome {
    // bilhete confirmado e válido para este evento; foi marcado como usado agora
    VALID,

    // já tinha sido validado antes (ver ticket.usedAt)
    ALREADY_USED,

    // o token existe mas é de outro evento (leitor aberto para o evento errado)
    WRONG_EVENT,

    // bilhete confirmado e válido, mas a leitura está fora da janela de entrada do jogo (não foi consumido)
    OUTSIDE_WINDOW,

    // o bilhete foi cancelado (evento cancelado ou compra anulada)
    CANCELLED,

    // token desconhecido / não corresponde a nenhum bilhete confirmado
    INVALID,
}

data class TicketValidationResult(
    val outcome: TicketValidationOutcome,
    // dados do bilhete para mostrar ao operador; null quando o token é desconhecido (INVALID)
    val ticket: TicketWithSector? = null,
)

/** Uma linha do carrinho: 1 bilhete num setor, com tipo de preço (e credenciais de sócio se MEMBER anónimo). */
data class TicketPurchaseLine(
    val sectorId: Long,
    val priceType: TicketPriceType,
    // preenchidos só para priceType=MEMBER em compra anónima; autenticado resolve pela sessão
    val memberNumber: Int?,
    val memberBirthDate: LocalDate?,
)

data class TicketPurchaseDraft(
    val buyerName: String,
    val buyerEmail: String,
    val lines: List<TicketPurchaseLine>,
)

private val LISBON_ZONE: java.time.ZoneId = java.time.ZoneId.of("Europe/Lisbon")

/**
 * Converte a data/hora LOCAL escolhida pelo admin (sem fuso, ex.: "2027-01-01T20:00" ou
 * "2027-01-01T20:00:00") para um Instant absoluto, interpretando-a em Europe/Lisbon.
 *
 * Usa java.time (ISO_LOCAL_DATE_TIME), que aceita o formato do <input type="datetime-local">
 * com OU sem segundos — ao contrário do parser ISO do kotlinx-datetime, que exige segundos.
 *
 * Transições de hora de verão (último domingo de março/outubro), via ZonedDateTime:
 *  - "Spring forward" (março, 01:00 -> 02:00): 01:00–01:59 não existe; é deslocada para a
 *    frente (ex.: 01:30 -> 02:30). Nunca lança por causa do gap.
 *  - "Fall back" (outubro, 02:00 -> 01:00): 01:00–01:59 ocorre duas vezes; resolve para a
 *    1ª ocorrência (offset de verão).
 */
private fun parseLisbonLocalDateTime(local: String): Instant {
    val localDateTime = java.time.LocalDateTime.parse(local.trim())
    val javaInstant = localDateTime.atZone(LISBON_ZONE).toInstant()
    return Instant.fromEpochMilliseconds(javaInstant.toEpochMilli())
}

private fun ValidationError.toEventError(): EventError.Validation =
    EventError.Validation(
        when (this) {
            is ValidationError.FieldError -> "$field $message"
            is ValidationError.GlobalError -> message
        },
    )

@Named
class EventService(
    private val transactionManager: TransactionManager,
    private val eventDomain: EventDomain,
    private val paymentService: PaymentService,
) {
    fun listEvents(filter: EventListFilter): Either<EventError, List<EventWithSectors>> =
        transactionManager.run { tx ->
            success(
                tx.eventRepository.findByFilter(filter).map { event ->
                    EventWithSectors(event, tx.eventRepository.findSectorsByEvent(event.eventId))
                },
            )
        }

    fun getEvent(eventId: Long): Either<EventError, EventWithSectors> =
        transactionManager.run { tx ->
            val event =
                tx.eventRepository.findById(eventId)
                    ?: return@run failure(EventError.NotFound("Event $eventId not found"))
            success(EventWithSectors(event, tx.eventRepository.findSectorsByEvent(eventId)))
        }

    fun createEvent(draft: EventDraft): Either<EventError, EventWithSectors> =
        transactionManager.run { tx ->
            val startsAt =
                parseStartsAt(draft.startsAtLocal)
                    ?: return@run failure(EventError.Validation("startsAt is not a valid date/time"))

            val event =
                Event(
                    eventId = 0,
                    name = draft.name,
                    description = draft.description,
                    startsAt = startsAt,
                    location = draft.location,
                    priceNormal = draft.priceNormal,
                    priceMember = draft.priceMember,
                    status = EventStatus.SCHEDULED,
                )
            when (val v = eventDomain.validateEventForCreation(event)) {
                is Either.Left -> return@run failure(v.value.toEventError())
                is Either.Right -> {}
            }
            validateSectorDrafts(draft.sectors)?.let { return@run failure(it) }

            val eventId = tx.eventRepository.save(event)
            val sectors =
                draft.sectors.map { d ->
                    val id = tx.eventRepository.saveSector(EventSector(0, eventId, d.name.trim(), d.capacity, 0))
                    EventSector(id, eventId, d.name.trim(), d.capacity, 0)
                }
            success(EventWithSectors(event.copy(eventId = eventId), sectors))
        }

    fun updateEvent(
        eventId: Long,
        draft: EventDraft,
    ): Either<EventError, EventWithSectors> =
        transactionManager.run { tx ->
            val original =
                tx.eventRepository.findById(eventId)
                    ?: return@run failure(EventError.NotFound("Event $eventId not found"))
            if (original.status == EventStatus.CANCELLED) {
                return@run failure(EventError.InvalidOperation("cannot edit a cancelled event"))
            }
            val startsAt =
                parseStartsAt(draft.startsAtLocal)
                    ?: return@run failure(EventError.Validation("startsAt is not a valid date/time"))

            // mudar a data/hora com bilhetes ativos = cancelar + recriar (decisão #2)
            if (startsAt != original.startsAt) {
                val hasActiveTickets = tx.ticketRepository.findByEventId(eventId).any { it.status != TicketStatus.CANCELLED }
                if (hasActiveTickets) {
                    return@run failure(
                        EventError.InvalidOperation(
                            "cannot change date/time while there are non-cancelled tickets; cancel the event instead",
                        ),
                    )
                }
                if (startsAt <= Clock.System.now()) {
                    return@run failure(EventError.Validation("startsAt must be in the future"))
                }
            }

            val updated =
                original.copy(
                    name = draft.name,
                    description = draft.description,
                    startsAt = startsAt,
                    location = draft.location,
                    priceNormal = draft.priceNormal,
                    priceMember = draft.priceMember,
                )
            when (val v = eventDomain.validateEventScalars(updated)) {
                is Either.Left -> return@run failure(v.value.toEventError())
                is Either.Right -> {}
            }
            validateSectorDrafts(draft.sectors)?.let { return@run failure(it) }

            applySectorDiff(tx, eventId, draft.sectors)?.let { return@run failure(it) }

            tx.eventRepository.update(updated)
            success(EventWithSectors(updated, tx.eventRepository.findSectorsByEvent(eventId)))
        }

    fun cancelEvent(eventId: Long): Either<EventError, Unit> =
        transactionManager.run { tx ->
            val event =
                tx.eventRepository.findById(eventId)
                    ?: return@run failure(EventError.NotFound("Event $eventId not found"))
            if (event.status == EventStatus.CANCELLED) {
                return@run failure(EventError.InvalidOperation("event already cancelled"))
            }
            tx.eventRepository.update(event.copy(status = EventStatus.CANCELLED))
            tx.ticketRepository.findByEventId(eventId).forEach { ticket ->
                // cancel() só transita RESERVED/CONFIRMED -> CANCELLED; só nesse caso libertamos o lugar
                if (tx.ticketRepository.cancel(ticket.ticketId)) {
                    tx.eventRepository.releaseSeat(ticket.sectorId)
                }
            }
            // TODO(Fase 3): enviar email aos compradores com instruções de reembolso manual
            success(Unit)
        }

    fun listEventTickets(eventId: Long): Either<EventError, List<TicketWithSector>> =
        transactionManager.run { tx ->
            tx.eventRepository.findById(eventId)
                ?: return@run failure(EventError.NotFound("Event $eventId not found"))
            val sectorNames = tx.eventRepository.findSectorsByEvent(eventId).associate { it.sectorId to it.name }
            success(
                tx.ticketRepository.findByEventId(eventId).map { ticket ->
                    TicketWithSector(ticket, sectorNames[ticket.sectorId] ?: "?")
                },
            )
        }

    /**
     * Valida um bilhete à porta a partir do token lido do QR. Corre numa só transação: o consumo
     * (CONFIRMED -> USED) é atómico (UPDATE condicional no estado), por isso duas leituras simultâneas
     * do mesmo bilhete resolvem-se sozinhas — só a primeira devolve VALID, a segunda ALREADY_USED.
     *
     * Só [eventId] inexistente é erro (URL errada); token desconhecido, bilhete usado/cancelado ou de
     * outro evento são *resultados* normais (o operador vê-os no ecrã), não erros.
     */
    fun validateTicket(
        eventId: Long,
        token: String,
    ): Either<EventError, TicketValidationResult> =
        transactionManager.run { tx ->
            val event =
                tx.eventRepository.findById(eventId)
                    ?: return@run failure(EventError.NotFound("Event $eventId not found"))

            val cleaned = token.trim()
            if (cleaned.isBlank()) return@run failure(EventError.Validation("token must not be blank"))

            val ticket =
                tx.ticketRepository.findByQrCode(cleaned)
                    ?: return@run success(TicketValidationResult(TicketValidationOutcome.INVALID))

            val sectorName =
                tx.eventRepository
                    .findSectorsByEvent(ticket.eventId)
                    .firstOrNull { it.sectorId == ticket.sectorId }
                    ?.name ?: "?"
            val withSector = TicketWithSector(ticket, sectorName)

            if (ticket.eventId != eventId) {
                return@run success(TicketValidationResult(TicketValidationOutcome.WRONG_EVENT, withSector))
            }

            when (ticket.status) {
                TicketStatus.CONFIRMED -> {
                    val nowInstant = Clock.System.now()
                    if (!isWithinEntryWindow(event, nowInstant)) {
                        // bilhete genuíno e confirmado, mas fora da janela do jogo — não consome
                        success(TicketValidationResult(TicketValidationOutcome.OUTSIDE_WINDOW, withSector))
                    } else {
                        if (tx.ticketRepository.markAsUsed(ticket.ticketId, nowInstant)) {
                            val used = ticket.copy(status = TicketStatus.USED, usedAt = nowInstant)
                            success(TicketValidationResult(TicketValidationOutcome.VALID, withSector.copy(ticket = used)))
                        } else {
                            // corrida: outra leitura consumiu-o entretanto; relê para devolver o usedAt real
                            val reread = tx.ticketRepository.findById(ticket.ticketId) ?: ticket
                            success(TicketValidationResult(TicketValidationOutcome.ALREADY_USED, withSector.copy(ticket = reread)))
                        }
                    }
                }
                TicketStatus.USED -> success(TicketValidationResult(TicketValidationOutcome.ALREADY_USED, withSector))
                TicketStatus.CANCELLED -> success(TicketValidationResult(TicketValidationOutcome.CANCELLED, withSector))
                // RESERVED não devia ter qr_code (só é atribuído na confirmação); por segurança, INVALID
                TicketStatus.RESERVED -> success(TicketValidationResult(TicketValidationOutcome.INVALID, withSector))
            }
        }

    /** Valida credenciais de sócio (compra anónima): existe, está ATIVO e a data de nascimento coincide. */
    fun validateMemberCredentials(
        memberNumber: Int,
        birthDate: LocalDate,
    ): Boolean =
        transactionManager.run { tx ->
            val member = tx.memberRepository.findByMemberNumber(memberNumber)
            member != null && member.status == MemberStatus.ATIVO && member.birthDate == birthDate
        }

    /**
     * Inicia a compra pública de bilhetes (anónima ou autenticada). Numa só transação:
     * valida o evento e o carrinho, resolve o desconto de sócio (auto para sócio autenticado;
     * nº + data de nascimento para anónimo), reserva os lugares de forma atómica, cria a charge
     * TICKET_PURCHASE e os bilhetes RESERVED, e abre a sessão Stripe (Payment PENDING).
     * Os bilhetes só passam a CONFIRMED no webhook de pagamento (peça 3).
     */
    fun startTicketCheckout(
        eventId: Long,
        draft: TicketPurchaseDraft,
        authenticatedUser: AuthenticatedUser?,
    ): Either<EventError, CheckoutSessionResult> =
        transactionManager.run { tx ->
            val event =
                tx.eventRepository.findById(eventId)
                    ?: return@run failure(EventError.NotFound("Event $eventId not found"))
            if (event.status != EventStatus.SCHEDULED) {
                return@run failure(EventError.InvalidOperation("event is not open for ticket sales"))
            }
            if (event.startsAt <= Clock.System.now()) {
                return@run failure(EventError.InvalidOperation("event has already started"))
            }
            if (draft.lines.isEmpty()) {
                return@run failure(EventError.Validation("select at least one ticket"))
            }
            if (draft.lines.size > MAX_TICKETS_PER_PURCHASE) {
                return@run failure(EventError.Validation("at most $MAX_TICKETS_PER_PURCHASE tickets per purchase"))
            }

            val sectorsById = tx.eventRepository.findSectorsByEvent(eventId).associateBy { it.sectorId }
            val priceFor = { type: TicketPriceType ->
                if (type == TicketPriceType.MEMBER) event.priceMember else event.priceNormal
            }

            val buyer = authenticatedUser?.let { tx.userRepository.findById(it.userId) }
            val charge =
                Charge(
                    chargeId = 0,
                    type = ChargeType.TICKET_PURCHASE,
                    memberId = null,
                    sponsorshipId = null,
                    value = draft.lines.sumOf { priceFor(it.priceType) },
                    status = ChargeStatus.PENDING,
                    season = null,
                    month = null,
                    createdAt =
                        Clock.System
                            .now()
                            .toLocalDateTime(TimeZone.currentSystemDefault())
                            .date,
                    creationUser = buyer,
                    chargeUser = buyer,
                    paidAt = null,
                )
            val chargeId = tx.chargeRepository.save(charge)

            val usedMemberIds = mutableSetOf<Long>()
            val lineItems = mutableListOf<StripeLineItem>()
            for (line in draft.lines) {
                val sector =
                    sectorsById[line.sectorId]
                        ?: return@run failure(EventError.Validation("sector ${line.sectorId} does not belong to this event"))
                val price = priceFor(line.priceType)

                var memberId: Long? = null
                var memberNumber: Int? = null
                if (line.priceType == TicketPriceType.MEMBER) {
                    val member =
                        resolveDiscountMember(tx, line, authenticatedUser)
                            ?: return@run failure(EventError.InvalidOperation("invalid or inactive member credentials"))
                    if (!usedMemberIds.add(member.memberId)) {
                        return@run failure(EventError.InvalidOperation("a member can buy at most one member ticket per event"))
                    }
                    if (tx.ticketRepository.existsActiveMemberTicket(eventId, member.memberId)) {
                        return@run failure(
                            EventError.InvalidOperation("member #${member.memberNumber} already has a ticket for this event"),
                        )
                    }
                    memberId = member.memberId
                    memberNumber = member.memberNumber
                }

                // reserva atómica do lugar; uma falha posterior faz rollback de todas as reservas
                if (!tx.eventRepository.reserveSeat(line.sectorId)) {
                    return@run failure(EventError.InvalidOperation("sector '${sector.name}' is sold out"))
                }

                val ticket =
                    Ticket(
                        ticketId = 0,
                        eventId = eventId,
                        sectorId = line.sectorId,
                        chargeId = chargeId,
                        memberId = memberId,
                        memberNumber = memberNumber,
                        priceType = line.priceType,
                        price = price,
                        buyerEmail = draft.buyerEmail.trim(),
                        buyerName = draft.buyerName.trim(),
                        status = TicketStatus.RESERVED,
                        qrCode = null,
                        usedAt = null,
                    )
                when (val v = eventDomain.validateTicketForPurchase(ticket)) {
                    is Either.Left -> return@run failure(v.value.toEventError())
                    is Either.Right -> tx.ticketRepository.save(ticket)
                }
                lineItems += StripeLineItem("${event.name} — ${sector.name} (${priceTypeLabel(line.priceType)})", price)
            }

            val savedCharge =
                tx.chargeRepository.findById(chargeId)
                    ?: return@run failure(EventError.NotFound("charge $chargeId not found"))
            when (val result = paymentService.createSessionAndPayment(tx, savedCharge, lineItems, draft.buyerEmail.trim())) {
                is Either.Left -> failure(result.value.toEventError())
                is Either.Right -> success(result.value)
            }
        }

    /**
     * Resolve o sócio para um bilhete MEMBER. Anónimo: nº de sócio + data de nascimento têm de
     * coincidir e o sócio tem de estar ATIVO (anti-fraude). Autenticado sem credenciais: usa o
     * sócio ativo da sessão (desconto automático). Devolve null se não validar.
     */
    private fun resolveDiscountMember(
        tx: Transaction,
        line: TicketPurchaseLine,
        authenticatedUser: AuthenticatedUser?,
    ): Member? {
        if (line.memberNumber != null) {
            val member = tx.memberRepository.findByMemberNumber(line.memberNumber) ?: return null
            if (member.status != MemberStatus.ATIVO) return null
            if (line.memberBirthDate == null || member.birthDate != line.memberBirthDate) return null
            return member
        }
        val activeMemberId = authenticatedUser?.activeMemberId ?: return null
        val member = tx.memberRepository.findById(activeMemberId) ?: return null
        return member.takeIf { it.status == MemberStatus.ATIVO }
    }

    private fun priceTypeLabel(priceType: TicketPriceType): String = if (priceType == TicketPriceType.MEMBER) "Sócio" else "Normal"

    private fun PaymentError.toEventError(): EventError =
        when (this) {
            is PaymentError.Validation -> EventError.Validation(message)
            is PaymentError.InvalidOperation -> EventError.InvalidOperation(message)
            is PaymentError.DomainError -> EventError.InvalidOperation(message)
        }

    /**
     * Janela de validação à porta, à volta do início do jogo. Substitui um TTL no token (decisão (c)):
     * o servidor impõe a janela, por isso o bilhete não precisa de expiração própria. Ancorada ao
     * [Event.startsAt] (Instant) em vez do "dia do evento" — robusto a jogos que passam da meia-noite.
     */
    private fun isWithinEntryWindow(
        event: Event,
        now: Instant,
    ): Boolean {
        val opensAt = event.startsAt - DOORS_OPEN_BEFORE
        val closesAt = event.startsAt + GATE_CLOSES_AFTER
        return now in opensAt..closesAt
    }

    private fun parseStartsAt(local: String): Instant? = runCatching { parseLisbonLocalDateTime(local) }.getOrNull()

    private fun validateSectorDrafts(sectors: List<SectorDraft>): EventError? {
        if (sectors.isEmpty()) return EventError.Validation("event must have at least one sector")
        if (sectors.any { it.name.isBlank() }) return EventError.Validation("sector name must not be blank")
        if (sectors.any { it.capacity <= 0 }) return EventError.Validation("sector capacity must be positive")
        val names = sectors.map { it.name.trim().lowercase() }
        if (names.size != names.toSet().size) return EventError.Validation("sector names must be unique")
        return null
    }

    /**
     * Reconcilia os setores do evento com os [drafts]: remove os que saíram (bloqueado se já têm
     * lugares ocupados), atualiza os existentes (capacidade não pode descer abaixo do ocupado) e
     * insere os novos. Devolve um [EventError] em caso de regra violada, ou null em sucesso.
     */
    private fun applySectorDiff(
        tx: pt.isel.jagoz.repository.Transaction,
        eventId: Long,
        drafts: List<SectorDraft>,
    ): EventError? {
        val existing = tx.eventRepository.findSectorsByEvent(eventId)
        val existingById = existing.associateBy { it.sectorId }
        val keepIds = drafts.mapNotNull { it.sectorId }.toSet()

        existing.filter { it.sectorId !in keepIds }.forEach { removed ->
            if (removed.occupied > 0) {
                return EventError.InvalidOperation("cannot remove sector '${removed.name}' with sold tickets")
            }
        }
        drafts.forEach { d ->
            if (d.sectorId != null) {
                val current =
                    existingById[d.sectorId]
                        ?: return EventError.Validation("sector ${d.sectorId} does not belong to this event")
                if (d.capacity < current.occupied) {
                    return EventError.InvalidOperation(
                        "capacity of '${current.name}' cannot be below the ${current.occupied} tickets already sold",
                    )
                }
            }
        }

        existing.filter { it.sectorId !in keepIds }.forEach { tx.eventRepository.deleteSector(it.sectorId) }
        drafts.forEach { d ->
            if (d.sectorId != null) {
                val occupied = existingById.getValue(d.sectorId).occupied
                tx.eventRepository.updateSector(EventSector(d.sectorId, eventId, d.name.trim(), d.capacity, occupied))
            } else {
                tx.eventRepository.saveSector(EventSector(0, eventId, d.name.trim(), d.capacity, 0))
            }
        }
        return null
    }

    private companion object {
        // decisão #10: limite de bilhetes por compra (normais + sócio somados)
        const val MAX_TICKETS_PER_PURCHASE = 5

        // Janela operacional de check-in à porta. Valores escolhidos para MVP/demo;
        // poderão passar a configuração do clube no futuro (ex.: "portas abrem 1h antes").
        val DOORS_OPEN_BEFORE = 3.hours
        val GATE_CLOSES_AFTER = 6.hours
    }
}
