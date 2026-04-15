package pt.isel.jagoz.repository.jdbi

import org.jdbi.v3.core.Handle
import pt.isel.jagoz.athlete.Athlete
import pt.isel.jagoz.repository.jdbi.mappers.AthleteMapper
import pt.isel.jagoz.repository.pt.isel.jagoz.repository.AthleteRepository

class JdbiAthleteRepository(private val handle: Handle) : AthleteRepository {
    override fun findById(id: Long): Athlete? {
        return handle.createQuery("SELECT * FROM athlete WHERE athlete_id = :id")
            .bind("id", id)
            .map { rs, _ -> AthleteMapper.map(rs) }
            .findOne()
            .orElse(null)
    }

    override fun findByMemberId(memberId: Long): Athlete? {
        return handle.createQuery("SELECT * FROM athlete WHERE member_id = :memberId")
            .bind("memberId", memberId)
            .map { rs, _ -> AthleteMapper.map(rs) }
            .findOne()
            .orElse(null)
    }

    override fun findAllActive(): List<Athlete> {
        return handle.createQuery("SELECT * FROM athlete WHERE active = true")
            .map { rs, _ -> AthleteMapper.map(rs) }
            .list()
    }

    override fun save(athlete: Athlete): Long {
        return handle.createUpdate(
            """
            INSERT INTO athlete (
                member_id, nationality, niss, nif, numero_utente, bi, bi_expiration_date,
                school, school_year, school_class, last_club, season, team_category, active
            ) VALUES (
                :memberId, :nationality, :niss, :nif, :numeroUtente, :bi, CAST(:biExpirationDate AS DATE),
                :school, :schoolYear, :schoolClass, :lastClub, :season, CAST(:teamCategory AS team_category), :active
            )
            """,
        )
            .bind("memberId", athlete.memberId)
            .bind("nationality", athlete.nationality)
            .bind("niss", athlete.niss)
            .bind("nif", athlete.nif)
            .bind("numeroUtente", athlete.numeroUtente)
            .bind("bi", athlete.bi)
            .bind("biExpirationDate", athlete.biExpirationDate.toString())
            .bind("school", athlete.school)
            .bind("schoolYear", athlete.schoolYear)
            .bind("schoolClass", athlete.schoolClass)
            .bind("lastClub", athlete.lastClub)
            .bind("season", athlete.season)
            .bind("teamCategory", athlete.teamCategory.name)
            .bind("active", athlete.active)
            .executeAndReturnGeneratedKeys()
            .mapTo(Long::class.java)
            .one()
    }

    override fun update(athlete: Athlete) {
        handle.createUpdate(
            """
            UPDATE athlete SET 
                member_id = :memberId,
                nationality = :nationality,
                niss = :niss,
                nif = :nif,
                numero_utente = :numeroUtente,
                bi = :bi,
                bi_expiration_date = CAST(:biExpirationDate AS DATE),
                school = :school,
                school_year = :schoolYear,
                school_class = :schoolClass,
                last_club = :lastClub,
                season = :season,
                team_category = CAST(:teamCategory AS team_category),
                active = :active
            WHERE athlete_id = :id
            """,
        )
            .bind("id", athlete.athleteId)
            .bind("memberId", athlete.memberId)
            .bind("nationality", athlete.nationality)
            .bind("niss", athlete.niss)
            .bind("nif", athlete.nif)
            .bind("numeroUtente", athlete.numeroUtente)
            .bind("bi", athlete.bi)
            .bind("biExpirationDate", athlete.biExpirationDate.toString())
            .bind("school", athlete.school)
            .bind("schoolYear", athlete.schoolYear)
            .bind("schoolClass", athlete.schoolClass)
            .bind("lastClub", athlete.lastClub)
            .bind("season", athlete.season)
            .bind("teamCategory", athlete.teamCategory.name)
            .bind("active", athlete.active)
            .execute()
    }
}
