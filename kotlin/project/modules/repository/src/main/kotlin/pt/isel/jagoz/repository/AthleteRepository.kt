package pt.isel.jagoz.repository.pt.isel.jagoz.repository

import pt.isel.jagoz.athlete.Athlete

interface AthleteRepository {
    fun findById(id: Long): Athlete?

    fun findByMemberId(memberId: Long): Athlete?

    fun findAllActive(): List<Athlete>

    fun save(athlete: Athlete): Long

    fun update(athlete: Athlete)
}
