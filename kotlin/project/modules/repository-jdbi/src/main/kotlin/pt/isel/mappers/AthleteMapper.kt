package pt.isel.mappers

import kotlinx.datetime.LocalDate
import pt.isel.athlete.Athlete
import pt.isel.sponsor.TeamCategory
import java.sql.ResultSet

object AthleteMapper {
    fun map(rs: ResultSet): Athlete =
        Athlete(
            athleteId = rs.getLong("athlete_id"),
            memberId = rs.getLong("member_id"),
            nationality = rs.getString("nationality"),
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
            teamCategory = TeamCategory.valueOf(rs.getString("team_category")),
            active = rs.getBoolean("active"),
        )
}

