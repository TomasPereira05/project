package pt.isel.jagoz.service

import jakarta.inject.Named
import org.slf4j.LoggerFactory
import pt.isel.jagoz.athlete.Athlete
import pt.isel.jagoz.athlete.AthleteDomain
import pt.isel.jagoz.athlete.AthleteError
import pt.isel.jagoz.repository.Transaction
import pt.isel.jagoz.repository.TransactionManager
import pt.isel.jagoz.sponsor.TeamCategory
import pt.isel.jagoz.utils.Either
import pt.isel.jagoz.utils.failure
import pt.isel.jagoz.utils.success

typealias AthleteResult = Either<AthleteError, Athlete>

@Named
class AthleteService(
    private val transactionManager: TransactionManager,
    private val athleteDomain: AthleteDomain,
) {
    companion object {
        private val LOG = LoggerFactory.getLogger(AthleteService::class.java)
    }

    fun createAthlete(athlete: Athlete): AthleteResult {
        LOG.info("Creating athlete for memberId=${athlete.memberId}")

        return transactionManager.run { tx ->
            val validation = athleteDomain.validateForCreation(athlete)
            if (validation is Either.Left) {
                return@run failure(AthleteError.ValidationError(validation.value.toString()))
            }

            val athleteId = tx.athleteRepository.save(athlete)
            success(athlete.copy(athleteId = athleteId))
        }
    }

    fun getAthleteById(athleteId: Long): AthleteResult {
        return transactionManager.run { tx ->
            val athleteResult = getAthleteOrFail(tx, athleteId)
            if (athleteResult is Either.Left) return@run athleteResult
            success((athleteResult as Either.Right).value)
        }
    }

    fun getAthleteByMemberId(memberId: Long): AthleteResult {
        return transactionManager.run { tx ->
            val athlete =
                tx.athleteRepository.findByMemberId(memberId)
                    ?: return@run failure(AthleteError.DomainError("Athlete not found for memberId=$memberId"))

            success(athlete)
        }
    }

    fun getAllActiveAthletes(): List<Athlete> {
        return transactionManager.run { tx ->
            tx.athleteRepository.findAllActive()
        }
    }

    fun changeTeamCategory(
        athleteId: Long,
        newCategory: TeamCategory,
    ): AthleteResult {
        LOG.info("Changing athlete team category athleteId=$athleteId to $newCategory")

        return transactionManager.run { tx ->
            val athleteRes = getAthleteOrFail(tx, athleteId)
            if (athleteRes is Either.Left) return@run athleteRes

            val athlete = (athleteRes as Either.Right).value
            val updatedRes = athleteDomain.changeTeamCategory(athlete, newCategory)

            when (updatedRes) {
                is Either.Left -> updatedRes
                is Either.Right -> {
                    val updated = updatedRes.value
                    tx.athleteRepository.update(updated)
                    success(updated)
                }
            }
        }
    }

    fun markInactive(athleteId: Long): AthleteResult {
        LOG.info("Marking athlete inactive athleteId=$athleteId")

        return transactionManager.run { tx ->
            val athleteRes = getAthleteOrFail(tx, athleteId)
            if (athleteRes is Either.Left) return@run athleteRes

            val athlete = (athleteRes as Either.Right).value
            val updatedRes = athleteDomain.markInactive(athlete)

            when (updatedRes) {
                is Either.Left -> updatedRes
                is Either.Right -> {
                    val updated = updatedRes.value
                    tx.athleteRepository.update(updated)
                    success(updated)
                }
            }
        }
    }

    fun reactivate(athleteId: Long): AthleteResult {
        LOG.info("Reactivating athlete athleteId=$athleteId")

        return transactionManager.run { tx ->
            val athleteRes = getAthleteOrFail(tx, athleteId)
            if (athleteRes is Either.Left) return@run athleteRes

            val athlete = (athleteRes as Either.Right).value
            val updatedRes = athleteDomain.reactivate(athlete)

            when (updatedRes) {
                is Either.Left -> updatedRes
                is Either.Right -> {
                    val updated = updatedRes.value
                    tx.athleteRepository.update(updated)
                    success(updated)
                }
            }
        }
    }

    fun updateSchoolInfo(
        athleteId: Long,
        school: String?,
        schoolYear: String?,
        schoolClass: String?,
    ): AthleteResult {
        LOG.info("Updating athlete school info athleteId=$athleteId")

        return transactionManager.run { tx ->
            val athleteRes = getAthleteOrFail(tx, athleteId)
            if (athleteRes is Either.Left) return@run athleteRes

            val athlete = (athleteRes as Either.Right).value
            val updatedRes = athleteDomain.updateSchoolInfo(athlete, school, schoolYear, schoolClass)

            when (updatedRes) {
                is Either.Left -> updatedRes
                is Either.Right -> {
                    val updated = updatedRes.value
                    tx.athleteRepository.update(updated)
                    success(updated)
                }
            }
        }
    }

    private fun getAthleteOrFail(
        tx: Transaction,
        athleteId: Long,
    ): AthleteResult {
        val athlete =
            tx.athleteRepository.findById(athleteId)
                ?: return failure(AthleteError.DomainError("Athlete not found: athleteId=$athleteId"))

        return success(athlete)
    }
}
