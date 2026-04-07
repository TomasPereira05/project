package pt.isel

import pt.isel.athlete.Athlete

interface AthleteRepository {
    fun findById(id: Long): Athlete?

    fun findByMemberId(memberId: Long): Athlete?

    fun findAllActive(): List<Athlete>

    fun save(athlete: Athlete): Long

    fun update(athlete: Athlete)
}
