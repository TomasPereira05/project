package pt.isel.jagoz.http

import jakarta.validation.Valid
import kotlinx.datetime.Clock
import kotlinx.datetime.TimeZone
import kotlinx.datetime.toLocalDate
import kotlinx.datetime.todayIn
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import pt.isel.jagoz.domain.athlete.Athlete
import pt.isel.jagoz.domain.athlete.AthleteError
import pt.isel.jagoz.domain.athlete.AthleteStatus
import pt.isel.jagoz.domain.user.AuthenticatedUser
import pt.isel.jagoz.domain.user.Role
import pt.isel.jagoz.domain.utils.handle
import pt.isel.jagoz.http.model.athlete.AthleteCreationInput
import pt.isel.jagoz.http.model.athlete.AthletePublicOutput
import pt.isel.jagoz.http.model.athlete.AthleteUpdateRequest
import pt.isel.jagoz.http.model.athlete.TeamCategoryChangeRequest
import pt.isel.jagoz.http.model.athlete.toAdminOutput
import pt.isel.jagoz.http.model.athlete.toDetailOutput
import pt.isel.jagoz.http.model.athlete.toManagedAthleteOutput
import pt.isel.jagoz.http.model.athlete.toPublicOutput
import pt.isel.jagoz.http.model.athlete.toRegistrationInput
import pt.isel.jagoz.http.model.athlete.toUpdateInput
import pt.isel.jagoz.http.model.member.ApprovalRequest
import pt.isel.jagoz.http.utils.Problem
import pt.isel.jagoz.http.utils.Uris
import pt.isel.jagoz.service.AthleteService
import pt.isel.jagoz.service.Page
import pt.isel.jagoz.service.PaymentService

@RestController
class AthleteController(
    private val athleteService: AthleteService,
    private val paymentService: PaymentService,
) {
    // ─────────────────────────────────────────────────────────────────
    // PÚBLICOS (anónimo OK)
    // ─────────────────────────────────────────────────────────────────

    /** Lista atletas activos de uma categoria. Devolve dados não-sensíveis. */
    @GetMapping(Uris.Athletes.LIST_BY_CATEGORY)
    fun listByCategory(
        @PathVariable teamCategoryId: Long,
    ): ResponseEntity<List<AthletePublicOutput>> {
        val today = Clock.System.todayIn(TimeZone.currentSystemDefault())
        val athletes = athleteService.listByTeamCategory(teamCategoryId, activeOnly = true)
        val membersById = athleteService.loadMembersFor(athletes)
        val outputs = athletes.mapNotNull { a -> membersById[a.memberId]?.let { m -> a.toPublicOutput(m, today) } }
        return ResponseEntity.ok(outputs)
    }

    /** Detalhe público do atleta (não expõe data de nascimento — só idade calculada). */
    @GetMapping(Uris.Athletes.GET_PUBLIC_DETAIL)
    fun getPublicDetail(
        @PathVariable athleteId: Long,
    ): ResponseEntity<*> =
        athleteService.getAthleteDetail(athleteId).handle(
            onFailure = { handleAthleteError(it) },
            onSuccess = { athlete -> respondDetailOutput(athlete) },
        )

    // ─────────────────────────────────────────────────────────────────
    // AUTENTICADO (qualquer role)
    // ─────────────────────────────────────────────────────────────────

    /**
     * Devolve o atleta do próprio user autenticado, com todos os dados sensíveis
     * (o user tem direito a ver os SEUS dados). 404 se o user não tem member
     * associado ou se o member não é atleta.
     */
    @GetMapping(Uris.Athletes.GET_ME)
    fun getMe(user: AuthenticatedUser): ResponseEntity<*> {
        val memberId =
            user.activeMemberId
                ?: return Problem.AthleteNotFound("activeMemberId", "null").response(HttpStatus.NOT_FOUND)
        return athleteService.getAthleteDetailByMemberId(memberId).handle(
            onFailure = { handleAthleteError(it) },
            onSuccess = { athlete -> respondAdminOutput(athlete) },
        )
    }

    /**
     * Atletas que a conta autenticada gere (pai/mãe/EE a gerir os filhos), via `user_athlete`.
     * Alimenta a secção "Os Meus Atletas" do perfil. Devolve cards leves — sem os dados
     * sensíveis do detalhe admin — com o estado da quota para sinalizar atrasos.
     */
    @GetMapping(Uris.Athletes.GET_MANAGED)
    fun getManaged(user: AuthenticatedUser): ResponseEntity<*> {
        val athletes = athleteService.getManagedAthletes(user.userId)
        val membersById = athleteService.loadMembersFor(athletes)
        val outputs =
            athletes.mapNotNull { a ->
                membersById[a.memberId]?.let { m ->
                    a.toManagedAthleteOutput(m, feeOverdue = paymentService.isMembershipFeeOverdue(m.memberId))
                }
            }
        return ResponseEntity.ok(outputs)
    }

    /** Inscreve um atleta novo. Cria Member (ATLETA_SOCIO, PENDENTE) + Athlete + Guardians. */
    @PostMapping(Uris.Athletes.CREATE_ATHLETE)
    fun createAthlete(
        @Valid @RequestBody input: AthleteCreationInput,
        user: AuthenticatedUser,
    ): ResponseEntity<*> {
        val resolvedUserId =
            if (input.isSelfRegistration) {
                if (user.activeMemberId != null) {
                    return Problem
                        .AthleteAlreadyRegistered(user.userId)
                        .response(HttpStatus.CONFLICT)
                }
                user.userId
            } else {
                null
            }
        // Quando um user normal inscreve um atleta que não é ele próprio (um filho), liga-o à
        // sua conta para aparecer no perfil. Inscrições feitas por staff não vão para o perfil deles.
        val creatorUserId = if (!input.isSelfRegistration && user.role == Role.NORMAL) user.userId else null
        val today = Clock.System.todayIn(TimeZone.currentSystemDefault())
        val serviceInput =
            input.toRegistrationInput(userId = resolvedUserId, creatorUserId = creatorUserId, registrationDate = today)
        return athleteService.registerAthlete(serviceInput).handle(
            onFailure = { handleAthleteError(it) },
            onSuccess = { athlete ->
                val member =
                    athleteService.loadMember(athlete.memberId)
                        ?: return@handle Problem
                            .AthleteNotFound("memberId", athlete.memberId)
                            .response(HttpStatus.INTERNAL_SERVER_ERROR)
                ResponseEntity
                    .created(Uris.Athletes.byId(athlete.athleteId))
                    .body(athlete.toAdminOutput(member))
            },
        )
    }

    // ─────────────────────────────────────────────────────────────────
    // SECRETARIA / ADMIN
    // ─────────────────────────────────────────────────────────────────

    /**
     * Lista admin paginada — inclui PENDENTES e REJEITADOS. Ordem: pendentes primeiro
     * (garantia de que ficam todos na página 1), depois os mais recentes.
     */
    @GetMapping(Uris.Athletes.GET_ALL_ADMIN)
    fun getAllAdmin(
        user: AuthenticatedUser,
        @RequestParam(defaultValue = "1") page: Int,
        @RequestParam(defaultValue = "8") size: Int,
        @RequestParam(required = false) search: String?,
        @RequestParam(required = false) teamCategory: List<Long>?,
        @RequestParam(required = false) status: List<AthleteStatus>?,
    ): ResponseEntity<*> {
        requireSecretariaOrAdmin(user)?.let { return it }
        val athletesPage =
            athleteService.getAthletesPage(
                page,
                size,
                search,
                teamCategory ?: emptyList(),
                status ?: emptyList(),
            )
        val membersById = athleteService.loadMembersFor(athletesPage.items)
        val items =
            athletesPage.items.mapNotNull { a ->
                membersById[a.memberId]?.let { m -> a.toAdminOutput(m) }
            }
        return ResponseEntity.ok(
            Page(
                items = items,
                page = athletesPage.page,
                size = athletesPage.size,
                total = athletesPage.total,
                totalPages = athletesPage.totalPages,
            ),
        )
    }

    @GetMapping(Uris.Athletes.GET_ADMIN_DETAIL)
    fun getAdminDetail(
        @PathVariable athleteId: Long,
        user: AuthenticatedUser,
    ): ResponseEntity<*> {
        requireSecretariaOrAdmin(user)?.let { return it }
        return athleteService.getAthleteDetail(athleteId).handle(
            onFailure = { handleAthleteError(it) },
            onSuccess = { athlete -> respondAdminOutput(athlete) },
        )
    }

    @GetMapping(Uris.Athletes.GET_BY_MEMBER_ID)
    fun getByMemberId(
        @PathVariable memberId: Long,
        user: AuthenticatedUser,
    ): ResponseEntity<*> {
        requireSecretariaOrAdmin(user)?.let { return it }
        return athleteService.getAthleteByMemberId(memberId).handle(
            onFailure = { handleAthleteError(it) },
            onSuccess = { athlete -> respondAdminOutput(athlete) },
        )
    }

    @PutMapping(Uris.Athletes.UPDATE_ATHLETE)
    fun updateAthlete(
        @PathVariable athleteId: Long,
        @Valid @RequestBody request: AthleteUpdateRequest,
        user: AuthenticatedUser,
    ): ResponseEntity<*> {
        requireSecretariaOrAdmin(user)?.let { return it }
        return athleteService
            .updateAthlete(
                athleteId = athleteId,
                input = request.toUpdateInput(),
            ).handle(
                onFailure = { handleAthleteError(it) },
                onSuccess = { athlete -> respondAdminOutput(athlete) },
            )
    }

    @PutMapping(Uris.Athletes.CHANGE_TEAM_CATEGORY)
    fun changeTeamCategory(
        @PathVariable athleteId: Long,
        @Valid @RequestBody request: TeamCategoryChangeRequest,
        user: AuthenticatedUser,
    ): ResponseEntity<*> {
        requireSecretariaOrAdmin(user)?.let { return it }
        return athleteService.changeTeamCategory(athleteId, request.teamCategoryId).handle(
            onFailure = { handleAthleteError(it) },
            onSuccess = { athlete -> respondAdminOutput(athlete) },
        )
    }

    @DeleteMapping(Uris.Athletes.DELETE_ATHLETE)
    fun deactivateAthlete(
        @PathVariable athleteId: Long,
        user: AuthenticatedUser,
    ): ResponseEntity<*> {
        requireSecretariaOrAdmin(user)?.let { return it }
        return athleteService.markInactive(athleteId).handle(
            onFailure = { handleAthleteError(it) },
            onSuccess = { athlete -> respondAdminOutput(athlete) },
        )
    }

    @PutMapping(Uris.Athletes.REACTIVATE_ATHLETE)
    fun reactivateAthlete(
        @PathVariable athleteId: Long,
        user: AuthenticatedUser,
    ): ResponseEntity<*> {
        requireSecretariaOrAdmin(user)?.let { return it }
        return athleteService.reactivate(athleteId).handle(
            onFailure = { handleAthleteError(it) },
            onSuccess = { athlete -> respondAdminOutput(athlete) },
        )
    }

    /** Aprova a inscrição: Member PENDENTE→ATIVO + Athlete.active=true. */
    @PutMapping(Uris.Athletes.APPROVE_ATHLETE)
    fun approveAthlete(
        @PathVariable athleteId: Long,
        @Valid @RequestBody approvalRequest: ApprovalRequest,
        user: AuthenticatedUser,
    ): ResponseEntity<*> {
        requireSecretariaOrAdmin(user)?.let { return it }
        return athleteService.approveAthlete(athleteId, approvalRequest.approvalDate.toLocalDate()).handle(
            onFailure = { handleAthleteError(it) },
            onSuccess = { athlete -> respondAdminOutput(athlete) },
        )
    }

    /** Rejeita a inscrição: Member PENDENTE→REJEITADO + Athlete.active=false (preservado em BD). */
    @PutMapping(Uris.Athletes.REJECT_ATHLETE)
    fun rejectAthlete(
        @PathVariable athleteId: Long,
        user: AuthenticatedUser,
    ): ResponseEntity<*> {
        requireSecretariaOrAdmin(user)?.let { return it }
        return athleteService.rejectAthlete(athleteId).handle(
            onFailure = { handleAthleteError(it) },
            onSuccess = { athlete -> respondAdminOutput(athlete) },
        )
    }

    private fun requireSecretariaOrAdmin(user: AuthenticatedUser): ResponseEntity<Any>? =
        if (user.role == Role.SECRETARIA || user.role == Role.ADMIN) {
            null
        } else {
            Problem.Unauthorized("requires SECRETARIA or ADMIN role").response(HttpStatus.FORBIDDEN)
        }

    private fun respondDetailOutput(athlete: Athlete): ResponseEntity<Any> {
        val member =
            athleteService.loadMember(athlete.memberId)
                ?: return Problem
                    .AthleteNotFound("memberId", athlete.memberId)
                    .response(HttpStatus.INTERNAL_SERVER_ERROR)
        val today = Clock.System.todayIn(TimeZone.currentSystemDefault())
        return ResponseEntity.ok<Any>(athlete.toDetailOutput(member, today))
    }

    private fun respondAdminOutput(athlete: Athlete): ResponseEntity<Any> {
        val member =
            athleteService.loadMember(athlete.memberId)
                ?: return Problem
                    .AthleteNotFound("memberId", athlete.memberId)
                    .response(HttpStatus.INTERNAL_SERVER_ERROR)
        return ResponseEntity.ok<Any>(athlete.toAdminOutput(member))
    }

    private fun handleAthleteError(error: AthleteError): ResponseEntity<Any> =
        when (error) {
            is AthleteError.NotFound -> {
                Problem.AthleteNotFound(error.field, error.value).response(HttpStatus.NOT_FOUND)
            }

            is AthleteError.DomainError -> {
                Problem.ValidationError(error.message).response(HttpStatus.BAD_REQUEST)
            }

            is AthleteError.ValidationError -> {
                Problem.ValidationError(error.message).response(HttpStatus.BAD_REQUEST)
            }

            is AthleteError.InvalidOperation -> {
                Problem.InvalidOperation("athlete-operation", error.message).response(HttpStatus.BAD_REQUEST)
            }

            is AthleteError.AlreadyRegistered -> {
                Problem.AthleteAlreadyRegistered(error.userId).response(HttpStatus.CONFLICT)
            }

            is AthleteError.AlreadyExists -> {
                Problem.MemberAlreadyExists(error.field, error.value).response(HttpStatus.CONFLICT)
            }

            is AthleteError.TeamCategoryNotFound -> {
                Problem.TeamCategoryNotFound(error.teamCategoryId).response(HttpStatus.NOT_FOUND)
            }

            is AthleteError.GuardianMemberNotFound -> {
                Problem.GuardianMemberNotFound(error.memberNumber).response(HttpStatus.NOT_FOUND)
            }

            is AthleteError.InvalidStateTransition -> {
                Problem
                    .AthleteInvalidStateTransition(error.athleteId, error.currentStatus, error.attempted)
                    .response(HttpStatus.CONFLICT)
            }

            is AthleteError.InvalidDateField -> {
                Problem.InvalidAthleteDateField(error.field, error.reason).response(HttpStatus.BAD_REQUEST)
            }
        }
}
