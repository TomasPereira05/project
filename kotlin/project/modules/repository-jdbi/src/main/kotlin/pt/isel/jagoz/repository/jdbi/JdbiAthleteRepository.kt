package pt.isel.jagoz.repository.jdbi

import org.jdbi.v3.core.Handle
import pt.isel.jagoz.domain.athlete.Athlete
import pt.isel.jagoz.domain.athlete.AthleteStatus
import pt.isel.jagoz.domain.athlete.Guardian
import pt.isel.jagoz.repository.AthleteRepository

class JdbiAthleteRepository(
    private val handle: Handle,
) : AthleteRepository {
    override fun findById(id: Long): Athlete? =
        handle
            .createQuery(
                """
                $SELECT_ATHLETE_BASE
                WHERE a.athlete_id = :id
                """.trimIndent(),
            ).bind("id", id)
            .mapTo(Athlete::class.java)
            .findOne()
            .orElse(null)

    override fun findByMemberId(memberId: Long): Athlete? =
        handle
            .createQuery(
                """
                $SELECT_ATHLETE_BASE
                WHERE a.member_id = :memberId
                """.trimIndent(),
            ).bind("memberId", memberId)
            .mapTo(Athlete::class.java)
            .findOne()
            .orElse(null)

    override fun findAllActive(): List<Athlete> =
        handle
            .createQuery(
                """
                $SELECT_ATHLETE_BASE
                JOIN jagoz.member m ON m.member_id = a.member_id
                WHERE a.active = true AND m.status = 'ATIVO'
                """.trimIndent(),
            ).mapTo(Athlete::class.java)
            .list()

    override fun findAll(): List<Athlete> =
        handle
            .createQuery(
                """
                $SELECT_ATHLETE_BASE
                ORDER BY a.athlete_id DESC
                """.trimIndent(),
            ).mapTo(Athlete::class.java)
            .list()

    /**
     * Pendentes primeiro (para ficarem todos na página 1), depois mais recentes.
     * Faz JOIN com `member` para conseguir ordenar por `member.status`.
     */
    override fun findPage(
        limit: Int,
        offset: Int,
    ): List<Athlete> =
        handle
            .createQuery(
                """
                $SELECT_ATHLETE_BASE
                JOIN jagoz.member m ON m.member_id = a.member_id
                ORDER BY (m.status = 'PENDENTE') DESC, a.athlete_id DESC
                LIMIT :limit OFFSET :offset
                """.trimIndent(),
            ).bind("limit", limit)
            .bind("offset", offset)
            .mapTo(Athlete::class.java)
            .list()

    override fun countAll(): Long =
        handle
            .createQuery("SELECT COUNT(*) FROM jagoz.athlete")
            .mapTo(Long::class.java)
            .one()

    override fun findPageFiltered(
        limit: Int,
        offset: Int,
        search: String?,
        teamCategoryIds: List<Long>,
        statuses: List<AthleteStatus>,
    ): List<Athlete> {
        val sql =
            StringBuilder(
                """
                $SELECT_ATHLETE_BASE
                JOIN jagoz.member m ON m.member_id = a.member_id
                """.trimIndent(),
            ).appendAthleteFilters(search, teamCategoryIds, statuses)
                .append(" ORDER BY (m.status = 'PENDENTE') DESC, a.athlete_id DESC")
                .append(" LIMIT :limit OFFSET :offset")
                .toString()

        return handle
            .createQuery(sql)
            .bind("limit", limit)
            .bind("offset", offset)
            .bindAthleteFilters(search, teamCategoryIds)
            .mapTo(Athlete::class.java)
            .list()
    }

    override fun countFiltered(
        search: String?,
        teamCategoryIds: List<Long>,
        statuses: List<AthleteStatus>,
    ): Long {
        val sql =
            StringBuilder(
                """
                SELECT COUNT(*) FROM jagoz.athlete a
                JOIN jagoz.member m ON m.member_id = a.member_id
                """.trimIndent(),
            ).appendAthleteFilters(search, teamCategoryIds, statuses)
                .toString()

        return handle
            .createQuery(sql)
            .bindAthleteFilters(search, teamCategoryIds)
            .mapTo(Long::class.java)
            .one()
    }

    /**
     * Constrói o WHERE da listagem filtrada. Dentro de cada dimensão (escalão, estado) as
     * opções combinam-se com OR; entre dimensões com AND. Os predicados de estado traduzem
     * o estado visual derivado para condições sobre `member.status` e `athlete.active`.
     */
    private fun StringBuilder.appendAthleteFilters(
        search: String?,
        teamCategoryIds: List<Long>,
        statuses: List<AthleteStatus>,
    ): StringBuilder {
        val clauses = mutableListOf<String>()
        if (!search.isNullOrBlank()) {
            clauses += "(m.member_number::text ILIKE :search OR m.complete_name ILIKE :search)"
        }
        if (teamCategoryIds.isNotEmpty()) {
            clauses += "a.team_category_id IN (<teamCategoryIds>)"
        }
        if (statuses.isNotEmpty()) {
            clauses += statuses.joinToString(" OR ", prefix = "(", postfix = ")") { it.toSqlPredicate() }
        }
        if (clauses.isNotEmpty()) {
            append(" WHERE ")
            append(clauses.joinToString(" AND "))
        }
        return this
    }

    private fun <T : org.jdbi.v3.core.statement.SqlStatement<T>> T.bindAthleteFilters(
        search: String?,
        teamCategoryIds: List<Long>,
    ): T {
        if (!search.isNullOrBlank()) {
            bind("search", "%${search.trim()}%")
        }
        if (teamCategoryIds.isNotEmpty()) {
            bindList("teamCategoryIds", teamCategoryIds)
        }
        return this
    }

    private fun AthleteStatus.toSqlPredicate(): String =
        when (this) {
            AthleteStatus.PENDENTE -> "m.status = 'PENDENTE'"
            AthleteStatus.REJEITADO -> "m.status = 'REJEITADO'"
            AthleteStatus.ATIVO -> "(m.status = 'ATIVO' AND a.active = TRUE)"
            AthleteStatus.INATIVO -> "((m.status = 'ATIVO' AND a.active = FALSE) OR m.status = 'INATIVO')"
        }

    override fun findByTeamCategory(
        teamCategoryId: Long,
        activeOnly: Boolean,
    ): List<Athlete> {
        val sql =
            if (activeOnly) {
                """
                $SELECT_ATHLETE_BASE
                JOIN jagoz.member m ON m.member_id = a.member_id
                WHERE a.team_category_id = :teamCategoryId
                  AND a.active = true
                  AND m.status = 'ATIVO'
                """.trimIndent()
            } else {
                """
                $SELECT_ATHLETE_BASE
                WHERE a.team_category_id = :teamCategoryId
                """.trimIndent()
            }
        return handle
            .createQuery(sql)
            .bind("teamCategoryId", teamCategoryId)
            .mapTo(Athlete::class.java)
            .list()
    }

    override fun findByIdWithDetail(id: Long): Athlete? {
        val athlete = findById(id) ?: return null
        val guardians = findGuardiansByAthleteId(id)
        return athlete.copy(guardians = guardians)
    }

    override fun save(athlete: Athlete): Long =
        handle
            .createUpdate(
                """
                INSERT INTO jagoz.athlete (
                    member_id, nationality, niss, numero_utente, bi, bi_expiration_date,
                    school, school_year, school_class, last_club, season, team_category_id,
                    jersey_number, position, photo_url, has_family_in_club,
                    school_certification_accepted, active
                ) VALUES (
                    :memberId, :nationality, :niss, :numeroUtente, :bi, CAST(:biExpirationDate AS DATE),
                    :school, :schoolYear, :schoolClass, :lastClub, :season, :teamCategoryId,
                    :jerseyNumber, :position, :photoUrl, :hasFamilyInClub,
                    :schoolCertificationAccepted, :active
                )
                """.trimIndent(),
            ).bindAthlete(athlete)
            .executeAndReturnGeneratedKeys()
            .mapTo(Long::class.java)
            .one()

    override fun update(athlete: Athlete) {
        handle
            .createUpdate(
                """
                UPDATE jagoz.athlete SET
                    member_id = :memberId,
                    nationality = :nationality,
                    niss = :niss,
                    numero_utente = :numeroUtente,
                    bi = :bi,
                    bi_expiration_date = CAST(:biExpirationDate AS DATE),
                    school = :school,
                    school_year = :schoolYear,
                    school_class = :schoolClass,
                    last_club = :lastClub,
                    season = :season,
                    team_category_id = :teamCategoryId,
                    jersey_number = :jerseyNumber,
                    position = :position,
                    photo_url = :photoUrl,
                    has_family_in_club = :hasFamilyInClub,
                    school_certification_accepted = :schoolCertificationAccepted,
                    active = :active
                WHERE athlete_id = :id
                """.trimIndent(),
            ).bind("id", athlete.athleteId)
            .bindAthlete(athlete)
            .execute()
    }

    override fun saveGuardians(
        athleteId: Long,
        guardians: List<Guardian>,
    ) {
        if (guardians.isEmpty()) return
        val batch =
            handle.prepareBatch(
                """
                INSERT INTO jagoz.guardian (
                    athlete_id, member_id, name, role, kinship, email, phone,
                    professional_activity, contact_phone
                ) VALUES (
                    :athleteId, :memberId, :name, CAST(:role AS jagoz.guardian_role), :kinship, :email, :phone,
                    :professionalActivity, :contactPhone
                )
                """.trimIndent(),
            )
        guardians.forEach { g ->
            batch
                .bind("athleteId", athleteId)
                .bind("memberId", g.memberId)
                .bind("name", g.name)
                .bind("role", g.role.name)
                .bind("kinship", g.kinship)
                .bind("email", g.email)
                .bind("phone", g.phone)
                .bind("professionalActivity", g.professionalActivity)
                .bind("contactPhone", g.contactPhone)
                .add()
        }
        batch.execute()
    }

    override fun deleteGuardiansByAthleteId(athleteId: Long) {
        handle
            .createUpdate("DELETE FROM jagoz.guardian WHERE athlete_id = :athleteId")
            .bind("athleteId", athleteId)
            .execute()
    }

    private fun findGuardiansByAthleteId(athleteId: Long): List<Guardian> =
        handle
            .createQuery(
                """
                SELECT guardian_id, athlete_id, member_id, name, role, kinship, email, phone,
                       professional_activity, contact_phone
                FROM jagoz.guardian
                WHERE athlete_id = :athleteId
                ORDER BY guardian_id ASC
                """.trimIndent(),
            ).bind("athleteId", athleteId)
            .mapTo(Guardian::class.java)
            .list()

    private fun org.jdbi.v3.core.statement.Update.bindAthlete(athlete: Athlete): org.jdbi.v3.core.statement.Update =
        this
            .bind("memberId", athlete.memberId)
            .bind("nationality", athlete.nationality)
            .bind("niss", athlete.niss)
            .bind("numeroUtente", athlete.numeroUtente)
            .bind("bi", athlete.bi)
            .bind("biExpirationDate", athlete.biExpirationDate.toString())
            .bind("school", athlete.school)
            .bind("schoolYear", athlete.schoolYear)
            .bind("schoolClass", athlete.schoolClass)
            .bind("lastClub", athlete.lastClub)
            .bind("season", athlete.season)
            .bind("teamCategoryId", athlete.teamCategory.teamId)
            .bind("jerseyNumber", athlete.jerseyNumber)
            .bind("position", athlete.position)
            .bind("photoUrl", athlete.photoUrl)
            .bind("hasFamilyInClub", athlete.hasFamilyInClub)
            .bind("schoolCertificationAccepted", athlete.schoolCertificationAccepted)
            .bind("active", athlete.active)

    companion object {
        private const val SELECT_ATHLETE_BASE = """
            SELECT a.*,
                   tc.team_category_id, tc.team_group_id,
                   tc.code AS team_category_code,
                   tc.label AS team_category_label,
                   tc.active AS team_category_active,
                   tc.sort_order AS team_category_sort_order
            FROM jagoz.athlete a
            LEFT JOIN jagoz.team_category tc ON tc.team_category_id = a.team_category_id
        """
    }
}
