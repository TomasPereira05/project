package pt.isel.jagoz.service

import jakarta.inject.Named
import pt.isel.jagoz.domain.season.Season
import pt.isel.jagoz.domain.season.SeasonError
import pt.isel.jagoz.domain.user.AuthenticatedUser
import pt.isel.jagoz.domain.user.canManageBackoffice
import pt.isel.jagoz.domain.utils.Either
import pt.isel.jagoz.domain.utils.failure
import pt.isel.jagoz.domain.utils.success
import pt.isel.jagoz.repository.TransactionManager

typealias SeasonListResult = Either<SeasonError, List<Season>>
typealias SeasonResult = Either<SeasonError, Season>

@Named
class SeasonService(
    private val transactionManager: TransactionManager,
) {
    fun getSeasons(authenticatedUser: AuthenticatedUser): SeasonListResult {
        if (!authenticatedUser.canManageBackoffice()) return failure(SeasonError.DomainError("Not authorized"))
        return transactionManager.run { transaction -> success(transaction.seasonRepository.findAll()) }
    }

    fun getActiveSeason(): SeasonResult =
        transactionManager.run { transaction ->
            transaction.seasonRepository.findActive()?.let { success(it) }
                ?: failure(SeasonError.DomainError("Active season not found"))
        }

    fun createSeason(
        authenticatedUser: AuthenticatedUser,
        season: Season,
    ): SeasonResult {
        if (!authenticatedUser.canManageBackoffice()) return failure(SeasonError.DomainError("Not authorized"))
        validateSeason(season)?.let { return failure(it) }

        return transactionManager.run { transaction ->
            if (transaction.seasonRepository.findByName(season.name.trim()) != null) {
                failure(SeasonError.ValidationError("Season already exists"))
            } else {
                val id = transaction.seasonRepository.save(season.copy(name = season.name.trim(), active = false))
                transaction.seasonRepository.findById(id)?.let { success(it) }
                    ?: failure(SeasonError.DomainError("Season not found"))
            }
        }
    }

    fun updateSeason(
        authenticatedUser: AuthenticatedUser,
        seasonId: Long,
        season: Season,
    ): SeasonResult {
        if (!authenticatedUser.canManageBackoffice()) return failure(SeasonError.DomainError("Not authorized"))
        validateSeason(season)?.let { return failure(it) }

        return transactionManager.run { transaction ->
            val current =
                transaction.seasonRepository.findById(seasonId)
                    ?: return@run failure(SeasonError.DomainError("Season not found"))
            val duplicate = transaction.seasonRepository.findByName(season.name.trim())
            if (duplicate != null && duplicate.seasonId != seasonId) {
                failure(SeasonError.ValidationError("Season already exists"))
            } else {
                val updated = season.copy(seasonId = seasonId, name = season.name.trim(), active = current.active)
                transaction.seasonRepository.update(updated)
                success(updated)
            }
        }
    }

    fun setActiveSeason(
        authenticatedUser: AuthenticatedUser,
        seasonId: Long,
    ): SeasonResult {
        if (!authenticatedUser.canManageBackoffice()) return failure(SeasonError.DomainError("Not authorized"))

        return transactionManager.run { transaction ->
            val season =
                transaction.seasonRepository.findById(seasonId)
                    ?: return@run failure(SeasonError.DomainError("Season not found"))
            transaction.seasonRepository.setActive(seasonId)
            success(season.copy(active = true))
        }
    }

    private fun validateSeason(season: Season): SeasonError? =
        when {
            !season.name.trim().matches(Regex("""^[0-9]{4}/[0-9]{4}$""")) ->
                SeasonError.ValidationError("Season name must use YYYY/YYYY")
            season.startsAt >= season.endsAt ->
                SeasonError.ValidationError("Season start date must be before end date")
            else -> null
        }
}
