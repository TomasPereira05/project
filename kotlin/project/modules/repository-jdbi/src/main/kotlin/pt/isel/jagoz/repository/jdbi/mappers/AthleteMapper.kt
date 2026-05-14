package pt.isel.jagoz.repository.jdbi.mappers

import kotlinx.datetime.LocalDate
import org.jdbi.v3.core.mapper.RowMapper
import org.jdbi.v3.core.statement.StatementContext
import pt.isel.jagoz.domain.athlete.Athlete
import pt.isel.jagoz.domain.team.TeamCategory
import java.sql.ResultSet

/**
 * Mapper para [Athlete]. Não carrega [Athlete.guardians] — fica `emptyList()`.
 * Quem precisa de detalhe completo (controllers admin) usa
 * [pt.isel.jagoz.repository.AthleteRepository.findByIdWithDetail] que faz uma
 * segunda query para carregar os guardians.
 */
class AthleteMapper : RowMapper<Athlete> {
    override fun map(
        rs: ResultSet,
        ctx: StatementContext,
    ): Athlete {
        val teamCategory =
            TeamCategory(
                teamId = rs.getLong("team_category_id"),
                teamGroupId = rs.getLong("team_group_id"),
                code = rs.getString("team_category_code"),
                label = rs.getString("team_category_label"),
                active = rs.getBoolean("team_category_active"),
                sortOrder = (rs.getObject("team_category_sort_order") as? Number)?.toInt(),
            )

        return Athlete(
            athleteId = rs.getLong("athlete_id"),
            memberId = rs.getLong("member_id"),
            nationality = rs.getString("nationality"),
            niss = rs.getString("niss"),
            numeroUtente = rs.getString("numero_utente"),
            bi = rs.getString("bi"),
            biExpirationDate = LocalDate.parse(rs.getString("bi_expiration_date")),
            school = rs.getString("school"),
            schoolYear = rs.getString("school_year"),
            schoolClass = rs.getString("school_class"),
            lastClub = rs.getString("last_club"),
            season = rs.getString("season"),
            teamCategory = teamCategory,
            jerseyNumber = (rs.getObject("jersey_number") as? Number)?.toInt(),
            position = rs.getString("position"),
            photoUrl = rs.getString("photo_url"),
            hasFamilyInClub = rs.getBoolean("has_family_in_club"),
            schoolCertificationAccepted = rs.getBoolean("school_certification_accepted"),
            active = rs.getBoolean("active"),
            guardians = emptyList(),
        )
    }
}
