package pt.isel.jagoz.http

import jakarta.servlet.http.HttpServletRequest
import kotlinx.datetime.LocalDate
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import pt.isel.jagoz.domain.event.EventError
import pt.isel.jagoz.domain.event.EventListFilter
import pt.isel.jagoz.domain.user.AuthenticatedUser
import pt.isel.jagoz.domain.user.canManageBackoffice
import pt.isel.jagoz.domain.utils.handle
import pt.isel.jagoz.http.model.event.EventCheckoutInput
import pt.isel.jagoz.http.model.event.EventCreateInput
import pt.isel.jagoz.http.model.event.EventUpdateInput
import pt.isel.jagoz.http.model.event.MemberCredentialInput
import pt.isel.jagoz.http.model.event.TicketValidateInput
import pt.isel.jagoz.http.model.event.toDraft
import pt.isel.jagoz.http.model.event.toOutput
import pt.isel.jagoz.http.model.payment.toOutput
import pt.isel.jagoz.http.pipeline.RequestTokenProcessor
import pt.isel.jagoz.http.utils.Problem
import pt.isel.jagoz.http.utils.Uris
import pt.isel.jagoz.service.EventService

@RestController
class EventController(
    private val eventService: EventService,
    private val requestTokenProcessor: RequestTokenProcessor,
) {
    @PostMapping(Uris.Events.CREATE)
    fun create(
        authenticatedUser: AuthenticatedUser,
        @RequestBody input: EventCreateInput,
    ): ResponseEntity<*> {
        requireManager(authenticatedUser)?.let { return it }
        return eventService.createEvent(input.toDraft()).handle(
            onFailure = { handleEventError(it) },
            onSuccess = { ResponseEntity.status(HttpStatus.CREATED).body(it.toOutput()) },
        )
    }

    @GetMapping(Uris.Events.GET_ALL)
    fun list(
        authenticatedUser: AuthenticatedUser,
        @RequestParam(required = false, defaultValue = "all") status: String,
    ): ResponseEntity<*> {
        requireManager(authenticatedUser)?.let { return it }
        return eventService.listEvents(parseFilter(status)).handle(
            onFailure = { handleEventError(it) },
            onSuccess = { events -> ResponseEntity.ok(events.map { it.toOutput() }) },
        )
    }

    // Público (sem AuthenticatedUser): jogos agendados e futuros, para a compra de bilhetes.
    @GetMapping(Uris.Events.AVAILABLE)
    fun available(): ResponseEntity<*> =
        eventService.listEvents(EventListFilter.SCHEDULED).handle(
            onFailure = { handleEventError(it) },
            onSuccess = { events -> ResponseEntity.ok(events.map { it.toOutput() }) },
        )

    // Público (anónimo): detalhe de um evento, usado pelo catálogo e pelo wizard de compra.
    @GetMapping(Uris.Events.GET_BY_ID)
    fun getById(
        @PathVariable eventId: Long,
    ): ResponseEntity<*> =
        eventService.getEvent(eventId).handle(
            onFailure = { handleEventError(it) },
            onSuccess = { ResponseEntity.ok(it.toOutput()) },
        )

    @PutMapping(Uris.Events.UPDATE)
    fun update(
        authenticatedUser: AuthenticatedUser,
        @PathVariable eventId: Long,
        @RequestBody input: EventUpdateInput,
    ): ResponseEntity<*> {
        requireManager(authenticatedUser)?.let { return it }
        return eventService.updateEvent(eventId, input.toDraft()).handle(
            onFailure = { handleEventError(it) },
            onSuccess = { ResponseEntity.ok(it.toOutput()) },
        )
    }

    @PostMapping(Uris.Events.CANCEL)
    fun cancel(
        authenticatedUser: AuthenticatedUser,
        @PathVariable eventId: Long,
    ): ResponseEntity<*> {
        requireManager(authenticatedUser)?.let { return it }
        return eventService.cancelEvent(eventId).handle(
            onFailure = { handleEventError(it) },
            onSuccess = { ResponseEntity.ok().build<Unit>() },
        )
    }

    @GetMapping(Uris.Events.TICKETS)
    fun tickets(
        authenticatedUser: AuthenticatedUser,
        @PathVariable eventId: Long,
    ): ResponseEntity<*> {
        requireManager(authenticatedUser)?.let { return it }
        return eventService.listEventTickets(eventId).handle(
            onFailure = { handleEventError(it) },
            onSuccess = { tickets -> ResponseEntity.ok(tickets.map { it.toOutput() }) },
        )
    }

    // Público (sem AuthenticatedUser para não exigir login): inicia a compra de bilhetes.
    // O user é lido opcionalmente — autenticado = desconto de sócio automático.
    @PostMapping(Uris.Events.CHECKOUT)
    fun checkout(
        request: HttpServletRequest,
        @PathVariable eventId: Long,
        @RequestBody input: EventCheckoutInput,
    ): ResponseEntity<*> =
        eventService.startTicketCheckout(eventId, input.toDraft(), optionalUser(request)).handle(
            onFailure = { handleEventError(it) },
            onSuccess = { ResponseEntity.status(HttpStatus.CREATED).body(it.toOutput()) },
        )

    /**
     * Lê o utilizador autenticado se houver sessão válida (header Authorization ou cookie "token"),
     * sem exigir autenticação. Replica a deteção do AuthenticationInterceptor mas nunca devolve 401.
     */
    private fun optionalUser(request: HttpServletRequest): AuthenticatedUser? {
        requestTokenProcessor.processAuthorizationHeaderValue(request.getHeader("Authorization"))?.let { return it }
        val cookie = request.cookies?.firstOrNull { it.name == "token" } ?: return null
        return requestTokenProcessor.processAuthorizationHeaderValue("Bearer ${cookie.value}")
    }

    // Backoffice: valida um bilhete à porta a partir do token lido do QR (marca-o como usado se válido).
    @PostMapping(Uris.Events.VALIDATE_TICKET)
    fun validateTicket(
        authenticatedUser: AuthenticatedUser,
        @PathVariable eventId: Long,
        @RequestBody input: TicketValidateInput,
    ): ResponseEntity<*> {
        requireManager(authenticatedUser)?.let { return it }
        return eventService.validateTicket(eventId, input.token).handle(
            onFailure = { handleEventError(it) },
            onSuccess = { ResponseEntity.ok(it.toOutput()) },
        )
    }

    // Público: valida credenciais de sócio (nº + data de nascimento) para o passo do wizard.
    @PostMapping(Uris.Events.VALIDATE_MEMBER)
    fun validateMember(
        @RequestBody input: MemberCredentialInput,
    ): ResponseEntity<*> {
        val birthDate = runCatching { LocalDate.parse(input.memberBirthDate) }.getOrNull()
        val valid = birthDate != null && eventService.validateMemberCredentials(input.memberNumber, birthDate)
        return ResponseEntity.ok(mapOf("valid" to valid))
    }

    private fun parseFilter(status: String): EventListFilter =
        when (status.lowercase()) {
            "scheduled" -> EventListFilter.SCHEDULED
            "past" -> EventListFilter.PAST
            "cancelled" -> EventListFilter.CANCELLED
            else -> EventListFilter.ALL
        }

    private fun requireManager(authenticatedUser: AuthenticatedUser): ResponseEntity<Any>? =
        if (authenticatedUser.canManageBackoffice()) {
            null
        } else {
            Problem.Unauthorized("Not authorized").response(HttpStatus.UNAUTHORIZED)
        }

    private fun handleEventError(error: EventError): ResponseEntity<Any> =
        when (error) {
            is EventError.Validation -> Problem.ValidationError(error.message).response(HttpStatus.BAD_REQUEST)
            is EventError.InvalidOperation -> Problem.InvalidOperation("event", error.message).response(HttpStatus.BAD_REQUEST)
            is EventError.NotFound -> Problem.ValidationError(error.message).response(HttpStatus.NOT_FOUND)
        }
}
