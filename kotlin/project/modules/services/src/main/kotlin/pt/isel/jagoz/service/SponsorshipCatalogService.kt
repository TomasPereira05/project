package pt.isel.jagoz.service

import jakarta.inject.Named
import pt.isel.jagoz.domain.sponsor.EquipmentPlacement
import pt.isel.jagoz.domain.sponsor.OtherSport
import pt.isel.jagoz.domain.sponsor.OtherSportPrice
import pt.isel.jagoz.domain.sponsor.PubOption
import pt.isel.jagoz.domain.sponsor.PubOptionPrice
import pt.isel.jagoz.domain.sponsor.SponsorError
import pt.isel.jagoz.domain.sponsor.TeamCategory
import pt.isel.jagoz.domain.sponsor.TeamSponsorshipPrice
import pt.isel.jagoz.domain.utils.failure
import pt.isel.jagoz.domain.utils.success
import pt.isel.jagoz.repository.TransactionManager

@Named
class SponsorshipCatalogService(
    private val transactionManager: TransactionManager,
) {
    fun getActivePubOptions(): List<PubOption> =
        transactionManager.run { transaction -> transaction.pubOptionRepository.findActive() }

    fun getActiveTeamCategories(): List<TeamCategory> =
        transactionManager.run { transaction -> transaction.teamCategoryRepository.findActive() }

    fun getActiveEquipmentPlacements(): List<EquipmentPlacement> =
        transactionManager.run { transaction -> transaction.equipmentPlacementRepository.findActive() }

    fun getActiveOtherSports(): List<OtherSport> =
        transactionManager.run { transaction -> transaction.otherSportRepository.findActive() }

    fun getPubOptionPrices(): List<PubOptionPrice> =
        transactionManager.run { transaction -> transaction.pubOptionPriceRepository.findAll() }

    fun getOtherSportPrices(): List<OtherSportPrice> =
        transactionManager.run { transaction -> transaction.otherSportPriceRepository.findAll() }

    fun getTeamSponsorshipPrices(): List<TeamSponsorshipPrice> =
        transactionManager.run { transaction -> transaction.teamSponsorshipPriceRepository.findAll() }

    fun createPubOption(pubOption: PubOption) =
        transactionManager.run { transaction ->
            val id = transaction.pubOptionRepository.save(pubOption)
            success(pubOption.copy(pubId = id))
        }

    fun updatePubOption(pubOption: PubOption) =
        transactionManager.run { transaction ->
            if (transaction.pubOptionRepository.findById(pubOption.pubId) == null) {
                return@run failure(SponsorError.DomainError("Pub option ${pubOption.pubId} not found"))
            }
            transaction.pubOptionRepository.update(pubOption)
            success(pubOption)
        }

    fun deactivatePubOption(pubOptionId: Long) =
        transactionManager.run { transaction ->
            if (transaction.pubOptionRepository.findById(pubOptionId) == null) {
                return@run failure(SponsorError.DomainError("Pub option $pubOptionId not found"))
            }
            transaction.pubOptionRepository.deactivate(pubOptionId)
            success(Unit)
        }

    fun reorderPubOptions(pubOptionIdsInOrder: List<Long>) =
        transactionManager.run { transaction ->
            val all = transaction.pubOptionRepository.findAll()
            val byId = all.associateBy { it.pubId }
            if (all.size != pubOptionIdsInOrder.size || pubOptionIdsInOrder.any { it !in byId }) {
                return@run failure(SponsorError.ValidationError("pubOptionIdsInOrder must include every pub option exactly once"))
            }
            val reordered =
                pubOptionIdsInOrder.mapIndexed { index, id ->
                    val updated = byId.getValue(id).copy(sortOrder = index)
                    transaction.pubOptionRepository.update(updated)
                    updated
                }
            success(reordered)
        }

    fun createTeamCategory(teamCategory: TeamCategory) =
        transactionManager.run { transaction ->
            val id = transaction.teamCategoryRepository.save(teamCategory)
            success(teamCategory.copy(teamId = id))
        }

    fun updateTeamCategory(teamCategory: TeamCategory) =
        transactionManager.run { transaction ->
            if (transaction.teamCategoryRepository.findById(teamCategory.teamId) == null) {
                return@run failure(SponsorError.DomainError("Team category ${teamCategory.teamId} not found"))
            }
            transaction.teamCategoryRepository.update(teamCategory)
            success(teamCategory)
        }

    fun deactivateTeamCategory(teamCategoryId: Long) =
        transactionManager.run { transaction ->
            if (transaction.teamCategoryRepository.findById(teamCategoryId) == null) {
                return@run failure(SponsorError.DomainError("Team category $teamCategoryId not found"))
            }
            transaction.teamCategoryRepository.deactivate(teamCategoryId)
            success(Unit)
        }

    fun reorderTeamCategories(teamCategoryIdsInOrder: List<Long>) =
        transactionManager.run { transaction ->
            val all = transaction.teamCategoryRepository.findAll()
            val byId = all.associateBy { it.teamId }
            if (all.size != teamCategoryIdsInOrder.size || teamCategoryIdsInOrder.any { it !in byId }) {
                return@run failure(SponsorError.ValidationError("teamCategoryIdsInOrder must include every team category exactly once"))
            }
            val reordered =
                teamCategoryIdsInOrder.mapIndexed { index, id ->
                    val updated = byId.getValue(id).copy(sortOrder = index)
                    transaction.teamCategoryRepository.update(updated)
                    updated
                }
            success(reordered)
        }

    fun createEquipmentPlacement(placement: EquipmentPlacement) =
        transactionManager.run { transaction ->
            val id = transaction.equipmentPlacementRepository.save(placement)
            success(placement.copy(equipmentId = id))
        }

    fun updateEquipmentPlacement(placement: EquipmentPlacement) =
        transactionManager.run { transaction ->
            if (transaction.equipmentPlacementRepository.findById(placement.equipmentId) == null) {
                return@run failure(SponsorError.DomainError("Equipment placement ${placement.equipmentId} not found"))
            }
            transaction.equipmentPlacementRepository.update(placement)
            success(placement)
        }

    fun deactivateEquipmentPlacement(placementId: Long) =
        transactionManager.run { transaction ->
            if (transaction.equipmentPlacementRepository.findById(placementId) == null) {
                return@run failure(SponsorError.DomainError("Equipment placement $placementId not found"))
            }
            transaction.equipmentPlacementRepository.deactivate(placementId)
            success(Unit)
        }

    fun reorderEquipmentPlacements(placementIdsInOrder: List<Long>) =
        transactionManager.run { transaction ->
            val all = transaction.equipmentPlacementRepository.findAll()
            val byId = all.associateBy { it.equipmentId }
            if (all.size != placementIdsInOrder.size || placementIdsInOrder.any { it !in byId }) {
                return@run failure(SponsorError.ValidationError("placementIdsInOrder must include every equipment placement exactly once"))
            }
            val reordered =
                placementIdsInOrder.mapIndexed { index, id ->
                    val updated = byId.getValue(id).copy(sortOrder = index)
                    transaction.equipmentPlacementRepository.update(updated)
                    updated
                }
            success(reordered)
        }

    fun createOtherSport(otherSport: OtherSport) =
        transactionManager.run { transaction ->
            val id = transaction.otherSportRepository.save(otherSport)
            success(otherSport.copy(sportId = id))
        }

    fun updateOtherSport(otherSport: OtherSport) =
        transactionManager.run { transaction ->
            if (transaction.otherSportRepository.findById(otherSport.sportId) == null) {
                return@run failure(SponsorError.DomainError("Other sport ${otherSport.sportId} not found"))
            }
            transaction.otherSportRepository.update(otherSport)
            success(otherSport)
        }

    fun deactivateOtherSport(sportId: Long) =
        transactionManager.run { transaction ->
            if (transaction.otherSportRepository.findById(sportId) == null) {
                return@run failure(SponsorError.DomainError("Other sport $sportId not found"))
            }
            transaction.otherSportRepository.deactivate(sportId)
            success(Unit)
        }

    fun reorderOtherSports(sportIdsInOrder: List<Long>) =
        transactionManager.run { transaction ->
            val all = transaction.otherSportRepository.findAll()
            val byId = all.associateBy { it.sportId }
            if (all.size != sportIdsInOrder.size || sportIdsInOrder.any { it !in byId }) {
                return@run failure(SponsorError.ValidationError("sportIdsInOrder must include every other sport exactly once"))
            }
            val reordered =
                sportIdsInOrder.mapIndexed { index, id ->
                    val updated = byId.getValue(id).copy(sortOrder = index)
                    transaction.otherSportRepository.update(updated)
                    updated
                }
            success(reordered)
        }

    fun upsertPubOptionPrice(
        pubOptionId: Long,
        price: Int,
    ) = transactionManager.run { transaction ->
        if (price < 0) return@run failure(SponsorError.ValidationError("price cannot be negative"))
        if (transaction.pubOptionRepository.findById(pubOptionId) == null) {
            return@run failure(SponsorError.DomainError("Pub option $pubOptionId not found"))
        }

        val model = PubOptionPrice(pubOptionId, price)
        transaction.pubOptionPriceRepository.upsert(model)
        success(model)
    }

    fun upsertOtherSportPrice(
        sportId: Long,
        price: Int,
    ) = transactionManager.run { transaction ->
        if (price < 0) return@run failure(SponsorError.ValidationError("price cannot be negative"))
        if (transaction.otherSportRepository.findById(sportId) == null) {
            return@run failure(SponsorError.DomainError("Other sport $sportId not found"))
        }

        val model = OtherSportPrice(sportId, price)
        transaction.otherSportPriceRepository.upsert(model)
        success(model)
    }

    fun upsertTeamSponsorshipPrice(
        teamCategoryId: Long,
        placementId: Long,
        price: Int,
    ) = transactionManager.run { transaction ->
        if (price < 0) return@run failure(SponsorError.ValidationError("price cannot be negative"))
        if (transaction.teamCategoryRepository.findById(teamCategoryId) == null) {
            return@run failure(SponsorError.DomainError("Team category $teamCategoryId not found"))
        }
        if (transaction.equipmentPlacementRepository.findById(placementId) == null) {
            return@run failure(SponsorError.DomainError("Placement $placementId not found"))
        }

        val existing = transaction.teamSponsorshipPriceRepository.findByTeamCategoryAndPlacement(teamCategoryId, placementId)
        val model =
            if (existing == null) {
                val id = transaction.teamSponsorshipPriceRepository.save(TeamSponsorshipPrice(0, teamCategoryId, placementId, price))
                TeamSponsorshipPrice(id, teamCategoryId, placementId, price)
            } else {
                val updated = existing.copy(price = price)
                transaction.teamSponsorshipPriceRepository.update(updated)
                updated
            }

        success(model)
    }
}
