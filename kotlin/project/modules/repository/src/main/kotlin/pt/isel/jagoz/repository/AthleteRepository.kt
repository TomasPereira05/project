package pt.isel.jagoz.repository

import pt.isel.jagoz.domain.athlete.Athlete

interface AthleteRepository {
    fun findById(id: Long): Athlete?

    fun findByMemberId(memberId: Long): Athlete?

    fun findAllActive(): List<Athlete>

    fun save(athlete: Athlete): Long

    fun update(athlete: Athlete)
}
