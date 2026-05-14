package pt.isel.jagoz.repository

import pt.isel.jagoz.domain.athlete.Athlete
import pt.isel.jagoz.domain.athlete.Guardian

interface AthleteRepository {
    // Leituras básicas (sem guardians)
    fun findById(id: Long): Athlete?

    fun findByMemberId(memberId: Long): Athlete?

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
