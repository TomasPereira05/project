package pt.isel.jagoz.http

import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RestController
import pt.isel.jagoz.domain.team.TeamCategory
import pt.isel.jagoz.domain.team.TeamError
import pt.isel.jagoz.domain.team.TeamGroup
import pt.isel.jagoz.domain.utils.handle
import pt.isel.jagoz.http.model.sponsor.ReorderRequest
import pt.isel.jagoz.http.model.team.TeamCategoryPriceOverrideRequest
import pt.isel.jagoz.http.model.team.TeamGroupPriceRequest
import pt.isel.jagoz.http.utils.Uris
import pt.isel.jagoz.service.TeamService

@RestController
class TeamController(
    private val teamService: TeamService,
) {

    // ---------------- TEAM GROUPS ----------------

    @GetMapping(Uris.Team.GROUPS_ACTIVE)
    fun getActiveTeamGroups() =
        ResponseEntity.ok(teamService.getActiveTeamGroups())

    @GetMapping(Uris.Team.GROUPS)
    fun getTeamGroups() =
        ResponseEntity.ok(teamService.getTeamGroups())

    @PostMapping(Uris.Team.GROUPS)
    fun createTeamGroup(@RequestBody group: TeamGroup): ResponseEntity<*> =
        teamService.createTeamGroup(group).handle(
            onFailure = { handleTeamError(it) },
            onSuccess = { ResponseEntity.status(HttpStatus.CREATED).body(it) },
        )

    @PutMapping(Uris.Team.GROUP_BY_ID)
    fun updateTeamGroup(
        @PathVariable groupId: Long,
        @RequestBody group: TeamGroup,
    ): ResponseEntity<*> =
        teamService.updateTeamGroup(group.copy(teamGroupId = groupId)).handle(
            onFailure = { handleTeamError(it) },
            onSuccess = { ResponseEntity.ok(it) },
        )

    @DeleteMapping(Uris.Team.GROUP_BY_ID)
    fun deactivateTeamGroup(@PathVariable groupId: Long): ResponseEntity<*> =
        teamService.deactivateTeamGroup(groupId).handle(
            onFailure = { handleTeamError(it) },
            onSuccess = { ResponseEntity.noContent().build() },
        )

    @PutMapping(Uris.Team.GROUPS_REORDER)
    fun reorderTeamGroups(@RequestBody request: ReorderRequest): ResponseEntity<*> =
        teamService.reorderTeamGroups(request.ids).handle(
            onFailure = { handleTeamError(it) },
            onSuccess = { ResponseEntity.ok(it) },
        )

    // ---------------- TEAM CATEGORIES ----------------

    @GetMapping(Uris.Team.CATEGORIES_ACTIVE)
    fun getActiveTeamCategories() =
        ResponseEntity.ok(teamService.getActiveTeamCategories())

    @GetMapping(Uris.Team.CATEGORIES)
    fun getTeamCategories() =
        ResponseEntity.ok(teamService.getTeamCategories())

    @PostMapping(Uris.Team.CATEGORIES)
    fun createTeamCategory(@RequestBody category: TeamCategory): ResponseEntity<*> =
        teamService.createTeamCategory(category).handle(
            onFailure = { handleTeamError(it) },
            onSuccess = { ResponseEntity.status(HttpStatus.CREATED).body(it) },
        )

    @PutMapping(Uris.Team.CATEGORY_BY_ID)
    fun updateTeamCategory(
        @PathVariable categoryId: Long,
        @RequestBody category: TeamCategory,
    ): ResponseEntity<*> =
        teamService.updateTeamCategory(category.copy(teamId = categoryId)).handle(
            onFailure = { handleTeamError(it) },
            onSuccess = { ResponseEntity.ok(it) },
        )

    @DeleteMapping(Uris.Team.CATEGORY_BY_ID)
    fun deactivateTeamCategory(@PathVariable categoryId: Long): ResponseEntity<*> =
        teamService.deactivateTeamCategory(categoryId).handle(
            onFailure = { handleTeamError(it) },
            onSuccess = { ResponseEntity.noContent().build() },
        )

    @PutMapping(Uris.Team.CATEGORIES_REORDER)
    fun reorderTeamCategories(@RequestBody request: ReorderRequest): ResponseEntity<*> =
        teamService.reorderTeamCategories(request.ids).handle(
            onFailure = { handleTeamError(it) },
            onSuccess = { ResponseEntity.ok(it) },
        )

    // ---------------- GROUP PRICES ----------------

    @GetMapping(Uris.Team.GROUP_PRICES)
    fun getTeamGroupPrices() =
        ResponseEntity.ok(teamService.getTeamGroupPrices())

    @PutMapping(Uris.Team.GROUP_PRICES)
    fun upsertTeamGroupPrice(
        @RequestBody request: TeamGroupPriceRequest
    ): ResponseEntity<*> =
        teamService.upsertTeamGroupPrice(
            request.teamGroupId,
            request.placementId,
            request.price
        ).handle(
            onFailure = { handleTeamError(it) },
            onSuccess = { ResponseEntity.ok(it) },
        )

    // ---------------- CATEGORY OVERRIDES ----------------

    @GetMapping(Uris.Team.CATEGORY_OVERRIDES)
    fun getTeamCategoryOverrides() =
        ResponseEntity.ok(teamService.getTeamCategoryOverrides())

    @PutMapping(Uris.Team.CATEGORY_OVERRIDES)
    fun upsertTeamCategoryOverride(
        @RequestBody request: TeamCategoryPriceOverrideRequest
    ): ResponseEntity<*> =
        teamService.upsertTeamCategoryOverride(
            request.teamCategoryId,
            request.placementId,
            request.price
        ).handle(
            onFailure = { handleTeamError(it) },
            onSuccess = { ResponseEntity.ok(it) },
        )

    private fun handleTeamError(error: TeamError): ResponseEntity<Any> =
        when (error) {
            is TeamError.NotFound -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(mapOf("error" to error))
            is TeamError.DomainError -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(mapOf("error" to error.message))
            is TeamError.ValidationError -> ResponseEntity.status(HttpStatus.BAD_REQUEST).body(mapOf("error" to error.message))
        }
}
