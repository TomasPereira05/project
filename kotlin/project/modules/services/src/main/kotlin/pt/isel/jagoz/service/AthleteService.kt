package pt.isel.jagoz.service

import jakarta.inject.Named
import kotlinx.datetime.LocalDate
import org.slf4j.LoggerFactory
import pt.isel.jagoz.domain.athlete.Athlete
import pt.isel.jagoz.domain.athlete.AthleteDomain
import pt.isel.jagoz.domain.athlete.AthleteError
import pt.isel.jagoz.domain.athlete.Guardian
import pt.isel.jagoz.domain.athlete.GuardianRole
import pt.isel.jagoz.domain.member.Member
import pt.isel.jagoz.domain.member.MemberCategory
import pt.isel.jagoz.domain.member.MemberDomain
import pt.isel.jagoz.domain.member.MemberError
import pt.isel.jagoz.domain.member.MemberStatus
import pt.isel.jagoz.domain.utils.ATHLETE_MEMBER_QUOTA
import pt.isel.jagoz.domain.utils.Either
import pt.isel.jagoz.domain.utils.ValidationError
import pt.isel.jagoz.domain.utils.failure
import pt.isel.jagoz.domain.utils.success
import pt.isel.jagoz.repository.Transaction
import pt.isel.jagoz.repository.TransactionManager

typealias AthleteResult = Either<AthleteError, Athlete>

/**
 * Input para a inscrição de um atleta (todos os campos do formulário em papel).
 * Reflecte a regra "atleta é sempre sócio": o service cria Member + Athlete +
 * Guardians numa só transacção.
 */
data class AthleteRegistrationInput(
    val userId: Long?,
    // Dados pessoais (vão para Member)
    val completeName: String,
    val birthDate: LocalDate,
    val birthplace: String?,
    val email: String,
    val phone: String,
    val homePhone: String?,
    val address: String,
    val postalCode: String,
    val city: String,
    val nif: String,
    val privacyAccepted: Boolean,
    val comsAccepted: Boolean,
    val registrationDate: LocalDate,
    // Dados atléticos (vão para Athlete)
    val nationality: String,
    val niss: String,
    val numeroUtente: String,
    val bi: String,
    val biExpirationDate: LocalDate,
    val school: String?,
    val schoolYear: String?,
    val schoolClass: String?,
    val lastClub: String?,
    val season: String?,
    val teamCategoryId: Long,
    val photoUrl: String?,
    val hasFamilyInClub: Boolean,
    val schoolCertificationAccepted: Boolean,
    // Agregado familiar
    val guardians: List<GuardianInput>,
)

data class GuardianInput(
    val name: String,
    val role: GuardianRole,
    val kinship: String?,
    val email: String,
    val phone: String,
    val professionalActivity: String?,
    val contactPhone: String?,
    /**
     * Nº Sócio do encarregado conforme digitado no formulário. O service procura
     * o Member com esse `memberNumber` e (se existir) usa o `memberId` resultante
     * como FK na linha do Guardian. Se preenchido e o Member não existir, falha
     * com `ValidationError`.
     */
    val memberNumber: Int? = null,
)

@Named
class AthleteService(
    private val transactionManager: TransactionManager,
    private val athleteDomain: AthleteDomain,
    private val memberDomain: MemberDomain,
) {
    companion object {
        private val LOG = LoggerFactory.getLogger(AthleteService::class.java)
    }

    /**
     * Inscreve um atleta novo. Cria simultaneamente:
     *   1. Member com category=ATLETA_SOCIO, status=PENDENTE, quota=0
     *   2. Athlete a apontar para esse member_id
     *   3. Lista de Guardians associados ao athlete
     * Tudo na mesma transacção. Rollback automático se qualquer validação ou INSERT falhar.
     */
    fun registerAthlete(input: AthleteRegistrationInput): AthleteResult {
        LOG.info("Registering new athlete for nif=${input.nif}")

        return transactionManager.run { tx ->
            val teamCategory =
                tx.teamCategoryRepository.findById(input.teamCategoryId)
                    ?: return@run failure(AthleteError.TeamCategoryNotFound(input.teamCategoryId))

            if (input.birthplace.isNullOrBlank()) {
                return@run failure(AthleteError.ValidationError("birthplace cannot be blank"))
            }

            if (input.biExpirationDate <= input.registrationDate) {
                return@run failure(
                    AthleteError.InvalidDateField("biExpirationDate", "must be after registration date"),
                )
            }

            val resolvedGuardians =
                input.guardians.map { g ->
                    if (g.memberNumber == null) {
                        g to null
                    } else {
                        val existing =
                            tx.memberRepository.findByMemberNumber(g.memberNumber)
                                ?: return@run failure(AthleteError.GuardianMemberNotFound(g.memberNumber))
                        g to existing.memberId
                    }
                }

            val member =
                Member(
                    memberId = 0,
                    userId = input.userId,
                    memberNumber = 0,
                    completeName = input.completeName,
                    birthDate = input.birthDate,
                    birthplace = input.birthplace,
                    email = input.email,
                    phone = input.phone,
                    homePhone = input.homePhone,
                    address = input.address,
                    postalCode = input.postalCode,
                    city = input.city,
                    nif = input.nif,
                    category = MemberCategory.ATLETA_SOCIO,
                    formerMember = false,
                    status = MemberStatus.PENDENTE,
                    membershipQuota = ATHLETE_MEMBER_QUOTA,
                    billingLocation = null,
                    registrationDate = input.registrationDate,
                    approvalDate = null,
                    privacyAccepted = input.privacyAccepted,
                    comsAccepted = input.comsAccepted,
                )

            when (val res = memberDomain.validateForCreation(member)) {
                is Either.Left -> return@run failure(memberErrorToAthleteError(res.value))
                is Either.Right -> Unit
            }

            val memberId = tx.memberRepository.save(member)

            val athlete =
                Athlete(
                    athleteId = 0,
                    memberId = memberId,
                    nationality = input.nationality,
                    niss = input.niss,
                    numeroUtente = input.numeroUtente,
                    bi = input.bi,
                    biExpirationDate = input.biExpirationDate,
                    school = input.school,
                    schoolYear = input.schoolYear,
                    schoolClass = input.schoolClass,
                    lastClub = input.lastClub,
                    season = input.season,
                    teamCategory = teamCategory,
                    jerseyNumber = null,
                    position = null,
                    photoUrl = input.photoUrl,
                    hasFamilyInClub = input.hasFamilyInClub,
                    schoolCertificationAccepted = input.schoolCertificationAccepted,
                    active = true,
                    guardians = resolvedGuardians.map { (g, fk) -> g.toGuardian(athleteId = 0, memberId = fk) },
                )

            when (val res = athleteDomain.validateForCreation(athlete)) {
                is Either.Left -> return@run failure(AthleteError.ValidationError(validationErrorMessage(res.value)))
                is Either.Right -> Unit
            }

            val athleteId = tx.athleteRepository.save(athlete)
            val guardians = resolvedGuardians.map { (g, fk) -> g.toGuardian(athleteId, memberId = fk) }
            tx.athleteRepository.saveGuardians(athleteId, guardians)

            success(athlete.copy(athleteId = athleteId, guardians = guardians))
        }
    }

    fun getAthleteById(athleteId: Long): AthleteResult =
        transactionManager.run { tx ->
            getAthleteOrFail(tx, athleteId)
        }

    fun getAthleteByMemberId(memberId: Long): AthleteResult =
        transactionManager.run { tx ->
            val athlete =
                tx.athleteRepository.findByMemberId(memberId)
                    ?: return@run failure(AthleteError.NotFound("memberId", memberId))
            success(athlete)
        }

    /**
     * Detalhe completo (com guardians carregados). Usado pelo perfil individual do jogador.
     */
    fun getAthleteDetail(athleteId: Long): AthleteResult =
        transactionManager.run { tx ->
            val athlete =
                tx.athleteRepository.findByIdWithDetail(athleteId)
                    ?: return@run failure(AthleteError.NotFound("athleteId", athleteId))
            success(athlete)
        }

    /**
     * Detalhe completo a partir do `memberId`. Usado pelo endpoint `/me` para um user
     * autenticado ver o seu próprio atleta (com os dados sensíveis a que tem direito).
     */
    fun getAthleteDetailByMemberId(memberId: Long): AthleteResult =
        transactionManager.run { tx ->
            val basic =
                tx.athleteRepository.findByMemberId(memberId)
                    ?: return@run failure(AthleteError.NotFound("memberId", memberId))
            val detail = tx.athleteRepository.findByIdWithDetail(basic.athleteId) ?: basic
            success(detail)
        }

    fun getAllActiveAthletes(): List<Athlete> =
        transactionManager.run { tx ->
            tx.athleteRepository.findAllActive()
        }

    /**
     * Lista completa para o painel admin — inclui PENDENTES e REJEITADOS.
     * O DTO no controller deriva o status visual juntando `member.status` e `athlete.active`.
     */
    fun getAllAthletes(): List<Athlete> =
        transactionManager.run { tx ->
            tx.athleteRepository.findAll()
        }

    /** Página da listagem admin. Pendentes primeiro, depois os mais recentes. */
    fun getAthletesPage(
        page: Int,
        size: Int,
    ): Page<Athlete> {
        val request = pageRequest(page, size)
        return transactionManager.run { tx ->
            pageOf(
                items = tx.athleteRepository.findPage(request.size, request.offset),
                request = request,
                total = tx.athleteRepository.countAll(),
            )
        }
    }

    /**
     * Aprova um atleta pendente. Numa só transacção:
     *  1. Aprova o Member associado (PENDENTE → ATIVO, ajusta quota, regista approvalDate).
     *  2. Garante que `Athlete.active = true` para o atleta passar a aparecer nas listagens.
     *
     * Falha se o Member não estiver em PENDENTE.
     */
    fun approveAthlete(
        athleteId: Long,
        approvalDate: LocalDate,
    ): AthleteResult {
        LOG.info("Approving athlete athleteId=$athleteId")

        return transactionManager.run { tx ->
            val athlete =
                tx.athleteRepository.findById(athleteId)
                    ?: return@run failure(AthleteError.NotFound("athleteId", athleteId))
            val member =
                tx.memberRepository.findById(athlete.memberId)
                    ?: return@run failure(AthleteError.NotFound("memberId", athlete.memberId))

            val memberForApproval =
                if (member.memberNumber > 0) {
                    member
                } else {
                    member.copy(memberNumber = tx.memberRepository.nextMemberNumber())
                }

            when (val res = memberDomain.approve(memberForApproval, approvalDate)) {
                is Either.Left -> return@run failure(memberErrorToAthleteError(res.value))
                is Either.Right -> tx.memberRepository.update(res.value)
            }

            val activated = if (athlete.active) athlete else athlete.copy(active = true)
            if (!athlete.active) tx.athleteRepository.update(activated)
            success(activated)
        }
    }

    /**
     * Rejeita um atleta pendente. Numa só transacção:
     *  1. Rejeita o Member associado (PENDENTE → REJEITADO).
     *  2. Marca `Athlete.active = false` para o atleta sair das listagens.
     *
     * Registos preservados em BD com status REJEITADO — coerente com o padrão dos sócios.
     */
    fun rejectAthlete(athleteId: Long): AthleteResult {
        LOG.info("Rejecting athlete athleteId=$athleteId")

        return transactionManager.run { tx ->
            val athlete =
                tx.athleteRepository.findById(athleteId)
                    ?: return@run failure(AthleteError.NotFound("athleteId", athleteId))
            val member =
                tx.memberRepository.findById(athlete.memberId)
                    ?: return@run failure(AthleteError.NotFound("memberId", athlete.memberId))

            when (val res = memberDomain.reject(member)) {
                is Either.Left -> return@run failure(memberErrorToAthleteError(res.value))
                is Either.Right -> tx.memberRepository.update(res.value)
            }

            val deactivated = if (!athlete.active) athlete else athlete.copy(active = false)
            if (athlete.active) tx.athleteRepository.update(deactivated)
            success(deactivated)
        }
    }

    /**
     * Carrega o Member associado a um atleta. Útil para o controller construir DTOs
     * que precisam de campos do Member (nome, data de nascimento, contactos).
     */
    fun loadMember(memberId: Long): Member? = transactionManager.run { tx -> tx.memberRepository.findById(memberId) }

    /**
     * Bulk load de Members para uma lista de atletas, indexado por memberId.
     * Evita N+1 quando o controller mapeia uma lista de Athletes para DTOs.
     */
    fun loadMembersFor(athletes: List<Athlete>): Map<Long, Member> {
        if (athletes.isEmpty()) return emptyMap()
        return transactionManager.run { tx ->
            tx.memberRepository
                .findByIds(athletes.map { it.memberId })
                .associateBy { it.memberId }
        }
    }

    /**
     * Lista atletas de uma categoria. Para listagens públicas, `activeOnly = true`
     * para esconder atletas inactivos. Não carrega guardians.
     */
    fun listByTeamCategory(
        teamCategoryId: Long,
        activeOnly: Boolean,
    ): List<Athlete> =
        transactionManager.run { tx ->
            tx.athleteRepository.findByTeamCategory(teamCategoryId, activeOnly)
        }

    fun changeTeamCategory(
        athleteId: Long,
        newTeamCategoryId: Long,
    ): AthleteResult {
        LOG.info("Changing athlete team category athleteId=$athleteId to teamCategoryId=$newTeamCategoryId")

        return transactionManager.run { tx ->
            val athleteRes = getAthleteOrFail(tx, athleteId)
            if (athleteRes is Either.Left) return@run athleteRes

            val newCategory =
                tx.teamCategoryRepository.findById(newTeamCategoryId)
                    ?: return@run failure(AthleteError.TeamCategoryNotFound(newTeamCategoryId))

            val athlete = (athleteRes as Either.Right).value
            when (val updatedRes = athleteDomain.changeTeamCategory(athlete, newCategory)) {
                is Either.Left -> updatedRes
                is Either.Right -> {
                    val updated = updatedRes.value
                    tx.athleteRepository.update(updated)
                    success(updated)
                }
            }
        }
    }

    /**
     * Update administrativo: substitui os campos editáveis do atleta. A categoria fica
     * fora — usa [changeTeamCategory] para isso (transição com validação dedicada).
     * Se [guardians] for não-nulo, substitui o conjunto inteiro (delete-all + insert).
     */
    fun updateAthlete(
        athleteId: Long,
        jerseyNumber: Int?,
        position: String?,
        photoUrl: String?,
        school: String?,
        schoolYear: String?,
        schoolClass: String?,
        lastClub: String?,
        season: String?,
        hasFamilyInClub: Boolean,
        guardians: List<GuardianInput>?,
    ): AthleteResult {
        LOG.info("Updating athlete data athleteId=$athleteId")

        return transactionManager.run { tx ->
            val current =
                tx.athleteRepository.findById(athleteId)
                    ?: return@run failure(AthleteError.NotFound("athleteId", athleteId))

            val updated =
                current.copy(
                    jerseyNumber = jerseyNumber,
                    position = position,
                    photoUrl = photoUrl,
                    school = school,
                    schoolYear = schoolYear,
                    schoolClass = schoolClass,
                    lastClub = lastClub,
                    season = season,
                    hasFamilyInClub = hasFamilyInClub,
                )
            tx.athleteRepository.update(updated)

            if (guardians != null) {
                val resolved =
                    guardians.map { g ->
                        if (g.memberNumber == null) {
                            g to null
                        } else {
                            val existing =
                                tx.memberRepository.findByMemberNumber(g.memberNumber)
                                    ?: return@run failure(AthleteError.GuardianMemberNotFound(g.memberNumber))
                            g to existing.memberId
                        }
                    }
                resolved.forEach { (g, fk) ->
                    when (val res = athleteDomain.validateGuardianForCreation(g.toGuardian(athleteId, fk))) {
                        is Either.Left -> return@run failure(AthleteError.ValidationError(validationErrorMessage(res.value)))
                        is Either.Right -> Unit
                    }
                }
                tx.athleteRepository.deleteGuardiansByAthleteId(athleteId)
                val newGuardians = resolved.map { (g, fk) -> g.toGuardian(athleteId, fk) }
                tx.athleteRepository.saveGuardians(athleteId, newGuardians)
                success(updated.copy(guardians = newGuardians))
            } else {
                success(updated)
            }
        }
    }

    fun markInactive(athleteId: Long): AthleteResult {
        LOG.info("Marking athlete inactive athleteId=$athleteId")

        return transactionManager.run { tx ->
            val athleteRes = getAthleteOrFail(tx, athleteId)
            if (athleteRes is Either.Left) return@run athleteRes

            val athlete = (athleteRes as Either.Right).value
            when (val updatedRes = athleteDomain.markInactive(athlete)) {
                is Either.Left -> updatedRes
                is Either.Right -> {
                    val updated = updatedRes.value
                    tx.athleteRepository.update(updated)
                    success(updated)
                }
            }
        }
    }

    fun reactivate(athleteId: Long): AthleteResult {
        LOG.info("Reactivating athlete athleteId=$athleteId")

        return transactionManager.run { tx ->
            val athleteRes = getAthleteOrFail(tx, athleteId)
            if (athleteRes is Either.Left) return@run athleteRes

            val athlete = (athleteRes as Either.Right).value
            when (val updatedRes = athleteDomain.reactivate(athlete)) {
                is Either.Left -> updatedRes
                is Either.Right -> {
                    val updated = updatedRes.value
                    tx.athleteRepository.update(updated)
                    success(updated)
                }
            }
        }
    }

    private fun getAthleteOrFail(
        tx: Transaction,
        athleteId: Long,
    ): AthleteResult {
        val athlete =
            tx.athleteRepository.findById(athleteId)
                ?: return failure(AthleteError.NotFound("athleteId", athleteId))
        return success(athlete)
    }

    private fun validationErrorMessage(error: ValidationError): String =
        when (error) {
            is ValidationError.FieldError -> "${error.field} ${error.message}"
            is ValidationError.GlobalError -> error.message
        }

    private fun memberErrorToAthleteError(error: MemberError): AthleteError =
        when (error) {
            is MemberError.ValidationError -> AthleteError.ValidationError("member: ${error.message}")
            is MemberError.AlreadyExists -> AthleteError.ValidationError("member: ${error.field}=${error.value} already exists")
            is MemberError.Conflict -> AthleteError.ValidationError("member: ${error.message}")
            is MemberError.InvalidOperation -> AthleteError.InvalidOperation("member: ${error.reason}")
            else -> AthleteError.ValidationError("member: $error")
        }

    private fun GuardianInput.toGuardian(
        athleteId: Long,
        memberId: Long? = null,
    ): Guardian =
        Guardian(
            guardianId = 0,
            athleteId = athleteId,
            memberId = memberId,
            name = name,
            role = role,
            kinship = kinship,
            email = email,
            phone = phone,
            professionalActivity = professionalActivity,
            contactPhone = contactPhone,
        )
}
