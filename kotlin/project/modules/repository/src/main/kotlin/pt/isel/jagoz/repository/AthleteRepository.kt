package pt.isel.jagoz.repository

import pt.isel.jagoz.domain.athlete.Athlete
import pt.isel.jagoz.domain.athlete.AthleteStatus
import pt.isel.jagoz.domain.athlete.Guardian

interface AthleteRepository {
    // Leituras básicas (sem guardians)
    fun findById(id: Long): Athlete?

    fun findByMemberId(memberId: Long): Athlete?

    /**
     * Atletas que uma conta de user gere (encarregado a gerir os filhos), via `user_athlete`.
     * Alimenta a secção "Os Meus Atletas" do perfil. Sem carregar guardians.
     */
    fun findByManagingUser(userId: Long): List<Athlete>

    /** Liga uma conta de user a um atleta que gere (idempotente). */
    fun linkUserToAthlete(
        userId: Long,
        athleteId: Long,
    )

    /**
     * `true` se o user gere o atleta cujo member é [memberId] (via `user_athlete`). Usado
     * para autorizar o encarregado a pagar a quota do atleta.
     */
    fun isUserManagingMember(
        userId: Long,
        memberId: Long,
    ): Boolean

    // Listagens (sem guardians)
    fun findAllActive(): List<Athlete>

    /** Lista completa para o painel admin — inclui PENDENTES e REJEITADOS. */
    fun findAll(): List<Athlete>

    /**
     * Página da listagem admin. Pendentes vêm primeiro (assim ficam todos na página 1),
     * depois ordenados por mais recentes.
     */
    fun findPage(
        limit: Int,
        offset: Int,
    ): List<Athlete>

    /** Total para cálculo de páginas. */
    fun countAll(): Long

    fun countByStatus(status: AthleteStatus): Long

    /**
     * Página filtrada da listagem admin. Pesquisa por nº de sócio ou nome, e filtra por
     * conjuntos de escalões e/ou estados (OR dentro de cada dimensão, AND entre dimensões).
     * Listas vazias = sem filtro nessa dimensão. Mantém a ordem: pendentes primeiro.
     */
    fun findPageFiltered(
        limit: Int,
        offset: Int,
        search: String?,
        teamCategoryIds: List<Long>,
        statuses: List<AthleteStatus>,
    ): List<Athlete>

    fun countFiltered(
        search: String?,
        teamCategoryIds: List<Long>,
        statuses: List<AthleteStatus>,
    ): Long

    fun findByTeamCategory(
        teamCategoryId: Long,
        activeOnly: Boolean,
    ): List<Athlete>

    // Detalhe (com guardians carregados via segunda query)
    fun findByIdWithDetail(id: Long): Athlete?

    // Escritas
    fun save(athlete: Athlete): Long

    fun update(athlete: Athlete)

    fun saveGuardians(
        athleteId: Long,
        guardians: List<Guardian>,
    )

    fun deleteGuardiansByAthleteId(athleteId: Long)
}
