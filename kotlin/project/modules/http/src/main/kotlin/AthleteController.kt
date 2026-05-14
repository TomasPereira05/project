package pt.isel.jagoz.http

import kotlinx.datetime.Clock
import kotlinx.datetime.TimeZone
import kotlinx.datetime.todayIn
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import pt.isel.jagoz.domain.athlete.Athlete
import pt.isel.jagoz.domain.athlete.AthleteError
import pt.isel.jagoz.domain.member.Member
import pt.isel.jagoz.domain.user.AuthenticatedUser
import pt.isel.jagoz.domain.user.Role
import pt.isel.jagoz.domain.utils.handle
import pt.isel.jagoz.http.model.athlete.AthleteAdminDto
import pt.isel.jagoz.http.model.athlete.AthleteCreationInputDto
import pt.isel.jagoz.http.model.athlete.AthleteDetailDto
import pt.isel.jagoz.http.model.athlete.AthletePublicDto
import pt.isel.jagoz.http.model.athlete.AthleteUpdateRequest
import pt.isel.jagoz.http.model.athlete.SchoolInfoRequest
import pt.isel.jagoz.http.model.athlete.TeamCategoryChangeRequest
import pt.isel.jagoz.http.model.member.ApprovalRequest
import kotlinx.datetime.toLocalDate
import pt.isel.jagoz.http.model.athlete.toAdminDto
import pt.isel.jagoz.http.model.athlete.toDetailDto
import pt.isel.jagoz.http.model.athlete.toPublicDto
import pt.isel.jagoz.http.model.athlete.toRegistrationInput
import pt.isel.jagoz.http.model.athlete.toServiceInput
import pt.isel.jagoz.http.utils.Problem
import pt.isel.jagoz.http.utils.Uris
import pt.isel.jagoz.service.AthleteService
import pt.isel.jagoz.service.Page

@RestController
class AthleteController(
    private val athleteService: AthleteService,
) {
    // ─────────────────────────────────────────────────────────────────
    // PÚBLICOS (anónimo OK)
    // ─────────────────────────────────────────────────────────────────

    /** Lista atletas activos de uma categoria. Devolve dados não-sensíveis. */
    @GetMapping(Uris.Athletes.LIST_BY_CATEGORY)
    fun listByCategory(
        @PathVariable teamCategoryId: Long,
    ): ResponseEntity<List<AthletePublicDto>> {
        val today = Clock.System.todayIn(TimeZone.currentSystemDefault())
        val athletes = athleteService.listByTeamCategory(teamCategoryId, activeOnly = true)
        val membersById = athleteService.loadMembersFor(athletes)
        val dtos = athletes.mapNotNull { a -> membersById[a.memberId]?.let { m -> a.toPublicDto(m, today) } }
        return ResponseEntity.ok(dtos)
    }

    /** Detalhe público do atleta (não expõe data de nascimento — só idade calculada). */
    @GetMapping(Uris.Athletes.GET_PUBLIC_DETAIL)
    fun getPublicDetail(
        @PathVariable athleteId: Long,
    ): ResponseEntity<*> =
        athleteService.getAthleteDetail(athleteId).handle(
            onFailure = { handleAthleteError(it) },
            onSuccess = { athlete -> respondDetailDto(athlete) },
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
        val memberId = user.activeMemberId
            ?: return Problem.AthleteNotFound("activeMemberId", "null").response(HttpStatus.NOT_FOUND)
        return athleteService.getAthleteDetailByMemberId(memberId).handle(
            onFailure = { handleAthleteError(it) },
            onSuccess = { athlete -> respondAdminDto(athlete) },
        )
    }

    /** Inscreve um atleta novo. Cria Member (ATLETA_SOCIO, PENDENTE) + Athlete + Guardians. */
    @PostMapping(Uris.Athletes.CREATE_ATHLETE)
    fun createAthlete(
        @RequestBody input: AthleteCreationInputDto,
        user: AuthenticatedUser,
    ): ResponseEntity<*> {
        val resolvedUserId = if (input.isSelfRegistration) {
            if (user.activeMemberId != null) {
                return Problem
                    .ValidationError("Já existe uma inscrição associada à conta autenticada.")
                    .response(HttpStatus.BAD_REQUEST)
            }
            user.userId
        } else {
            null
        }
        val today = Clock.System.todayIn(TimeZone.currentSystemDefault())
        val serviceInput = input.toRegistrationInput(userId = resolvedUserId, registrationDate = today)
        return athleteService.registerAthlete(serviceInput).handle(
            onFailure = { handleAthleteError(it) },
            onSuccess = { athlete ->
                val member = athleteService.loadMember(athlete.memberId)
                    ?: return@handle Problem.AthleteNotFound("memberId", athlete.memberId)
                        .response(HttpStatus.INTERNAL_SERVER_ERROR)
                ResponseEntity
                    .created(Uris.Athletes.byId(athlete.athleteId))
                    .body(athlete.toAdminDto(member))
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
    ): ResponseEntity<*> {
        requireSecretariaOrAdmin(user)?.let { return it }
        val athletesPage = athleteService.getAthletesPage(page, size)
        val membersById = athleteService.loadMembersFor(athletesPage.items)
        val itemDtos = athletesPage.items.mapNotNull { a ->
            membersById[a.memberId]?.let { m -> a.toAdminDto(m) }
        }
        return ResponseEntity.ok(
            Page(
                items = itemDtos,
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
            onSuccess = { athlete -> respondAdminDto(athlete) },
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
            onSuccess = { athlete -> respondAdminDto(athlete) },
        )
    }

    @PutMapping(Uris.Athletes.UPDATE_ATHLETE)
    fun updateAthlete(
        @PathVariable athleteId: Long,
        @RequestBody request: AthleteUpdateRequest,
        user: AuthenticatedUser,
    ): ResponseEntity<*> {
        requireSecretariaOrAdmin(user)?.let { return it }
        return athleteService
            .updateAthlete(
                athleteId = athleteId,
                jerseyNumber = request.jerseyNumber,
                position = request.position,
                photoUrl = request.photoUrl,
                school = request.school,
                schoolYear = request.schoolYear,
                schoolClass = request.schoolClass,
                lastClub = request.lastClub,
                season = request.season,
                hasFamilyInClub = request.hasFamilyInClub,
                guardians = request.guardians?.map { it.toServiceInput() },
            ).handle(
                onFailure = { handleAthleteError(it) },
                onSuccess = { athlete -> respondAdminDto(athlete) },
            )
    }

    @PutMapping(Uris.Athletes.CHANGE_TEAM_CATEGORY)
    fun changeTeamCategory(
        @PathVariable athleteId: Long,
        @RequestBody request: TeamCategoryChangeRequest,
        user: AuthenticatedUser,
    ): ResponseEntity<*> {
        requireSecretariaOrAdmin(user)?.let { return it }
        return athleteService.changeTeamCategory(athleteId, request.teamCategoryId).handle(
            onFailure = { handleAthleteError(it) },
            onSuccess = { athlete -> respondAdminDto(athlete) },
        )
    }

    @PutMapping(Uris.Athletes.UPDATE_SCHOOL_INFO)
    fun updateSchoolInfo(
        @PathVariable athleteId: Long,
        @RequestBody request: SchoolInfoRequest,
        user: AuthenticatedUser,
    ): ResponseEntity<*> {
        requireSecretariaOrAdmin(user)?.let { return it }
        return athleteService
            .updateSchoolInfo(athleteId, request.school, request.schoolYear, request.schoolClass)
            .handle(
                onFailure = { handleAthleteError(it) },
                onSuccess = { athlete -> respondAdminDto(athlete) },
            )
    }

    @PatchMapping(Uris.Athletes.DEACTIVATE_ATHLETE)
    fun deactivateAthlete(
        @PathVariable athleteId: Long,
        user: AuthenticatedUser,
    ): ResponseEntity<*> {
        requireSecretariaOrAdmin(user)?.let { return it }
        return athleteService.markInactive(athleteId).handle(
            onFailure = { handleAthleteError(it) },
            onSuccess = { athlete -> respondAdminDto(athlete) },
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
            onSuccess = { athlete -> respondAdminDto(athlete) },
        )
    }

    /** Aprova a inscrição: Member PENDENTE→ATIVO + Athlete.active=true. */
    @PutMapping(Uris.Athletes.APPROVE_ATHLETE)
    fun approveAthlete(
        @PathVariable athleteId: Long,
        @RequestBody approvalRequest: ApprovalRequest,
        user: AuthenticatedUser,
    ): ResponseEntity<*> {
        requireSecretariaOrAdmin(user)?.let { return it }
        return athleteService.approveAthlete(athleteId, approvalRequest.approvalDate.toLocalDate()).handle(
            onFailure = { handleAthleteError(it) },
            onSuccess = { athlete -> respondAdminDto(athlete) },
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
            onSuccess = { athlete -> respondAdminDto(athlete) },
        )
    }

    // ─────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────

    private fun requireSecretariaOrAdmin(user: AuthenticatedUser): ResponseEntity<Any>? =
        if (user.role == Role.SECRETARIA || user.role == Role.ADMIN) {
            null
        } else {
            Problem.Unauthorized("requires SECRETARIA or ADMIN role").response(HttpStatus.FORBIDDEN)
        }

    private fun respondDetailDto(athlete: Athlete): ResponseEntity<Any> {
        val member = athleteService.loadMember(athlete.memberId)
            ?: return Problem.AthleteNotFound("memberId", athlete.memberId)
                .response(HttpStatus.INTERNAL_SERVER_ERROR)
        val today = Clock.System.todayIn(TimeZone.currentSystemDefault())
        return ResponseEntity.ok<Any>(athlete.toDetailDto(member, today))
    }

    private fun respondAdminDto(athlete: Athlete): ResponseEntity<Any> {
        val member = athleteService.loadMember(athlete.memberId)
            ?: return Problem.AthleteNotFound("memberId", athlete.memberId)
                .response(HttpStatus.INTERNAL_SERVER_ERROR)
        return ResponseEntity.ok<Any>(athlete.toAdminDto(member))
    }

    private fun handleAthleteError(error: AthleteError): ResponseEntity<Any> =
        when (error) {
            is AthleteError.NotFound -> Problem.AthleteNotFound(error.field, error.value).response(HttpStatus.NOT_FOUND)
            is AthleteError.DomainError -> Problem.ValidationError(error.message).response(HttpStatus.BAD_REQUEST)
            is AthleteError.ValidationError -> Problem.ValidationError(error.message).response(HttpStatus.BAD_REQUEST)
            is AthleteError.InvalidOperation ->
                Problem.InvalidOperation("athlete-operation", error.message).response(HttpStatus.BAD_REQUEST)
        }
}
