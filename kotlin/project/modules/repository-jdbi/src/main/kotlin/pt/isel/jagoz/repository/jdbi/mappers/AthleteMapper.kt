package pt.isel.jagoz.repository.jdbi.mappers

import kotlinx.datetime.LocalDate
import org.jdbi.v3.core.mapper.RowMapper
import org.jdbi.v3.core.statement.StatementContext
import pt.isel.jagoz.domain.athlete.Athlete
import pt.isel.jagoz.domain.sponsor.TeamCategory
import java.sql.ResultSet

class AthleteMapper : RowMapper<Athlete> {
    override fun map(
        rs: ResultSet,
        ctx: StatementContext,
    ): Athlete {
        // These fields exist in the domain but are not yet persisted in the current schema.
        // To keep the domain strict (non-null), we provide explicit placeholders.
        val notAvailable = "N/A"
        val teamCategory =
            TeamCategory(
                teamId = rs.getLong("team_category_id"),
                code = rs.getString("team_category_code"),
                label = rs.getString("team_category_label"),
                active = rs.getBoolean("team_category_active"),
                sortOrder = (rs.getObject("team_category_sort_order") as? Number)?.toInt(),
            )

        return Athlete(
            athleteId = rs.getLong("athlete_id"),
            memberId = rs.getLong("member_id"),
            nationality = rs.getString("nationality"),
            birthplace = notAvailable,
            birthdate = LocalDate.parse(rs.getString("birth_date")),
            email = rs.getString("email"),
            phone = rs.getString("phone"),
            postalCode = rs.getString("postal_code"),
            address = rs.getString("address"),
            city = rs.getString("city"),
            state = notAvailable,
            niss = rs.getString("niss"),
            nif = rs.getString("nif"),
            numeroUtente = rs.getString("numero_utente"),
            bi = rs.getString("bi"),
            biExpirationDate = LocalDate.parse(rs.getString("bi_expiration_date")),
            school = rs.getString("school"),
            schoolYear = rs.getString("school_year"),
            schoolClass = rs.getString("school_class"),
            lastClub = rs.getString("last_club"),
            season = rs.getString("season"),
            teamCategory = teamCategory,
            active = rs.getBoolean("active"),
            privacyAccepted = rs.getBoolean("privacy_accepted"),
            comsAccepted = rs.getBoolean("coms_accepted"),
            schoolCertificationAccepted = false,
        )
    }
}
