package pt.isel.jagoz.service

import jakarta.inject.Named
import pt.isel.jagoz.domain.team.TeamCategory
import pt.isel.jagoz.domain.team.TeamCategoryPriceOverride
import pt.isel.jagoz.domain.team.TeamError
import pt.isel.jagoz.domain.team.TeamGroup
import pt.isel.jagoz.domain.team.TeamGroupPrice
import pt.isel.jagoz.domain.utils.failure
import pt.isel.jagoz.domain.utils.success
import pt.isel.jagoz.repository.TransactionManager

@Named
class TeamService(
    private val transactionManager: TransactionManager,
) {
    fun getTeamGroupPrices() =
        transactionManager.run { transaction ->
            transaction.teamGroupPriceRepository.findAll()
        }

    fun getTeamCategoryOverrides() =
        transactionManager.run { transaction ->
            transaction.teamCategoryPriceOverrideRepository.findAll()
        }

    fun getActiveTeamCategories(): List<TeamCategory> =
        transactionManager.run { transaction -> transaction.teamCategoryRepository.findActive() }

    fun getTeamCategories(): List<TeamCategory> = transactionManager.run { transaction -> transaction.teamCategoryRepository.findAll() }

    fun getActiveTeamGroups(): List<TeamGroup> = transactionManager.run { transaction -> transaction.teamGroupRepository.findActive() }

    fun getTeamGroups(): List<TeamGroup> = transactionManager.run { transaction -> transaction.teamGroupRepository.findAll() }

    fun createTeamCategory(teamCategory: TeamCategory) =
        transactionManager.run { transaction ->
            val id = transaction.teamCategoryRepository.save(teamCategory)
            success(teamCategory.copy(teamId = id))
        }

    fun createTeamGroup(teamGroup: TeamGroup) =
        transactionManager.run { transaction ->
            val id = transaction.teamGroupRepository.save(teamGroup)
            success(teamGroup.copy(teamGroupId = id))
        }

    fun updateTeamGroup(teamGroup: TeamGroup) =
        transactionManager.run { transaction ->
            if (transaction.teamGroupRepository.findById(teamGroup.teamGroupId) == null) {
                return@run failure(TeamError.NotFound("Team group ${teamGroup.teamGroupId} not found"))
            }
            transaction.teamGroupRepository.update(teamGroup)
            success(teamGroup)
        }

    fun deactivateTeamGroup(teamGroupId: Long) =
        transactionManager.run { transaction ->
            if (transaction.teamGroupRepository.findById(teamGroupId) == null) {
                return@run failure(TeamError.NotFound("Team group $teamGroupId not found"))
            }
            transaction.teamGroupRepository.deactivate(teamGroupId)
            success(Unit)
        }

    fun reorderTeamGroups(teamGroupIdsInOrder: List<Long>) =
        transactionManager.run { transaction ->
            val all = transaction.teamGroupRepository.findAll()
            val byId = all.associateBy { it.teamGroupId }
            if (all.size != teamGroupIdsInOrder.size || teamGroupIdsInOrder.any { it !in byId }) {
                return@run failure(TeamError.ValidationError("teamGroupIdsInOrder must include every team group exactly once"))
            }
            val reordered =
                teamGroupIdsInOrder.mapIndexed { index, id ->
                    val updated = byId.getValue(id).copy(sortOrder = index)
                    transaction.teamGroupRepository.update(updated)
                    updated
                }
            success(reordered)
        }

    fun updateTeamCategory(teamCategory: TeamCategory) =
        transactionManager.run { transaction ->
            if (transaction.teamCategoryRepository.findById(teamCategory.teamId) == null) {
                return@run failure(TeamError.NotFound("Team category ${teamCategory.teamId} not found"))
            }
            transaction.teamCategoryRepository.update(teamCategory)
            success(teamCategory)
        }

    fun deactivateTeamCategory(teamCategoryId: Long) =
        transactionManager.run { transaction ->
            if (transaction.teamCategoryRepository.findById(teamCategoryId) == null) {
                return@run failure(TeamError.NotFound("Team category $teamCategoryId not found"))
            }
            transaction.teamCategoryRepository.deactivate(teamCategoryId)
            success(Unit)
        }

    fun reorderTeamCategories(teamCategoryIdsInOrder: List<Long>) =
        transactionManager.run { transaction ->
            val all = transaction.teamCategoryRepository.findAll()
            val byId = all.associateBy { it.teamId }
            if (all.size != teamCategoryIdsInOrder.size || teamCategoryIdsInOrder.any { it !in byId }) {
                return@run failure(TeamError.ValidationError("teamCategoryIdsInOrder must include every team category exactly once"))
            }
            val reordered =
                teamCategoryIdsInOrder.mapIndexed { index, id ->
                    val updated = byId.getValue(id).copy(sortOrder = index)
                    transaction.teamCategoryRepository.update(updated)
                    updated
                }
            success(reordered)
        }

    fun upsertTeamGroupPrice(
        groupId: Long,
        placementId: Long,
        price: Int,
    ) = transactionManager.run { transaction ->
        if (price < 0) return@run failure(TeamError.ValidationError("price cannot be negative"))
        if (transaction.teamGroupRepository.findById(groupId) == null) {
            return@run failure(TeamError.NotFound("Team group $groupId not found"))
        }
        if (transaction.equipmentPlacementRepository.findById(placementId) == null) {
            return@run failure(TeamError.NotFound("Equipment placement $placementId not found"))
        }

        val model = TeamGroupPrice(groupId, placementId, price)
        transaction.teamGroupPriceRepository.update(model.teamGroupId, model.placementId, model.price)
        success(model)
    }

    fun upsertTeamCategoryOverride(
        categoryId: Long,
        placementId: Long,
        price: Int,
    ) = transactionManager.run { transaction ->
        if (price < 0) {
            return@run failure(
                TeamError.ValidationError("price cannot be negative"),
            )
        }

        if (transaction.teamCategoryRepository.findById(categoryId) == null) {
            return@run failure(
                TeamError.NotFound("Team category $categoryId not found"),
            )
        }

        if (transaction.equipmentPlacementRepository.findById(placementId) == null) {
            return@run failure(
                TeamError.NotFound("Equipment placement $placementId not found"),
            )
        }

        val model =
            TeamCategoryPriceOverride(
                teamCategoryId = categoryId,
                placementId = placementId,
                price = price,
            )

        val existing =
            transaction.teamCategoryPriceOverrideRepository.find(
                categoryId,
                placementId,
            )

        if (existing == null) {
            transaction.teamCategoryPriceOverrideRepository.save(
                categoryId,
                placementId,
                price,
            )
        } else {
            transaction.teamCategoryPriceOverrideRepository.update(
                categoryId,
                placementId,
                price,
            )
        }

        success(model)
    }
}
