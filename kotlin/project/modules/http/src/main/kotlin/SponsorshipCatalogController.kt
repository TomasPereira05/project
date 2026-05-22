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
import pt.isel.jagoz.domain.sponsor.EquipmentPlacement
import pt.isel.jagoz.domain.sponsor.OtherSport
import pt.isel.jagoz.domain.sponsor.PubOption
import pt.isel.jagoz.domain.sponsor.SponsorError
import pt.isel.jagoz.domain.user.AuthenticatedUser
import pt.isel.jagoz.domain.user.canManageBackoffice
import pt.isel.jagoz.domain.utils.handle
import pt.isel.jagoz.http.model.sponsor.ReorderRequest
import pt.isel.jagoz.http.utils.Problem
import pt.isel.jagoz.http.utils.Uris
import pt.isel.jagoz.service.SponsorshipCatalogService

@RestController
class SponsorshipCatalogController(
    private val catalogService: SponsorshipCatalogService,
) {
    @GetMapping(Uris.SponsorshipCatalog.PUB_OPTIONS_ACTIVE)
    fun getActivePubOptions() = ResponseEntity.ok(catalogService.getActivePubOptions())

    @PostMapping(Uris.SponsorshipCatalog.PUB_OPTIONS)
    fun createPubOption(
        authenticatedUser: AuthenticatedUser,
        @RequestBody pubOption: PubOption,
    ): ResponseEntity<*> {
        requireCatalogManager(authenticatedUser)?.let { return it }
        return catalogService.createPubOption(pubOption).handle(
            onFailure = { handleSponsorError(it) },
            onSuccess = { ResponseEntity.status(HttpStatus.CREATED).body(it) },
        )
    }

    @PutMapping(Uris.SponsorshipCatalog.PUB_OPTION_BY_ID)
    fun updatePubOption(
        authenticatedUser: AuthenticatedUser,
        @PathVariable pubOptionId: Long,
        @RequestBody pubOption: PubOption,
    ): ResponseEntity<*> {
        requireCatalogManager(authenticatedUser)?.let { return it }
        return catalogService.updatePubOption(pubOption.copy(pubId = pubOptionId)).handle(
            onFailure = { handleSponsorError(it) },
            onSuccess = { ResponseEntity.ok(it) },
        )
    }

    @DeleteMapping(Uris.SponsorshipCatalog.PUB_OPTION_BY_ID)
    fun deactivatePubOption(
        authenticatedUser: AuthenticatedUser,
        @PathVariable pubOptionId: Long,
    ): ResponseEntity<*> {
        requireCatalogManager(authenticatedUser)?.let { return it }
        return catalogService.deactivatePubOption(pubOptionId).handle(
            onFailure = { handleSponsorError(it) },
            onSuccess = { ResponseEntity.noContent().build() },
        )
    }

    @PutMapping(Uris.SponsorshipCatalog.PUB_OPTIONS_REORDER)
    fun reorderPubOptions(
        authenticatedUser: AuthenticatedUser,
        @RequestBody request: ReorderRequest,
    ): ResponseEntity<*> {
        requireCatalogManager(authenticatedUser)?.let { return it }
        return catalogService.reorderPubOptions(request.ids).handle(
            onFailure = { handleSponsorError(it) },
            onSuccess = { ResponseEntity.ok(it) },
        )
    }

    @GetMapping(Uris.SponsorshipCatalog.EQUIPMENT_PLACEMENTS_ACTIVE)
    fun getActiveEquipmentPlacements() = ResponseEntity.ok(catalogService.getActiveEquipmentPlacements())

    @GetMapping(Uris.SponsorshipCatalog.OCCUPIED_TEAM_OPTIONS)
    fun getOccupiedTeamSponsorshipOptions() = ResponseEntity.ok(catalogService.getOccupiedTeamSponsorshipOptions())

    @PostMapping(Uris.SponsorshipCatalog.EQUIPMENT_PLACEMENTS)
    fun createEquipmentPlacement(
        authenticatedUser: AuthenticatedUser,
        @RequestBody placement: EquipmentPlacement,
    ): ResponseEntity<*> {
        requireCatalogManager(authenticatedUser)?.let { return it }
        return catalogService.createEquipmentPlacement(placement).handle(
            onFailure = { handleSponsorError(it) },
            onSuccess = { ResponseEntity.status(HttpStatus.CREATED).body(it) },
        )
    }

    @PutMapping(Uris.SponsorshipCatalog.EQUIPMENT_PLACEMENT_BY_ID)
    fun updateEquipmentPlacement(
        authenticatedUser: AuthenticatedUser,
        @PathVariable placementId: Long,
        @RequestBody placement: EquipmentPlacement,
    ): ResponseEntity<*> {
        requireCatalogManager(authenticatedUser)?.let { return it }
        return catalogService.updateEquipmentPlacement(placement.copy(equipmentId = placementId)).handle(
            onFailure = { handleSponsorError(it) },
            onSuccess = { ResponseEntity.ok(it) },
        )
    }

    @DeleteMapping(Uris.SponsorshipCatalog.EQUIPMENT_PLACEMENT_BY_ID)
    fun deactivateEquipmentPlacement(
        authenticatedUser: AuthenticatedUser,
        @PathVariable placementId: Long,
    ): ResponseEntity<*> {
        requireCatalogManager(authenticatedUser)?.let { return it }
        return catalogService.deactivateEquipmentPlacement(placementId).handle(
            onFailure = { handleSponsorError(it) },
            onSuccess = { ResponseEntity.noContent().build() },
        )
    }

    @PutMapping(Uris.SponsorshipCatalog.EQUIPMENT_PLACEMENTS_REORDER)
    fun reorderEquipmentPlacements(
        authenticatedUser: AuthenticatedUser,
        @RequestBody request: ReorderRequest,
    ): ResponseEntity<*> {
        requireCatalogManager(authenticatedUser)?.let { return it }
        return catalogService.reorderEquipmentPlacements(request.ids).handle(
            onFailure = { handleSponsorError(it) },
            onSuccess = { ResponseEntity.ok(it) },
        )
    }

    @GetMapping(Uris.SponsorshipCatalog.OTHER_SPORTS_ACTIVE)
    fun getActiveOtherSports() = ResponseEntity.ok(catalogService.getActiveOtherSports())

    @PostMapping(Uris.SponsorshipCatalog.OTHER_SPORTS)
    fun createOtherSport(
        authenticatedUser: AuthenticatedUser,
        @RequestBody otherSport: OtherSport,
    ): ResponseEntity<*> {
        requireCatalogManager(authenticatedUser)?.let { return it }
        return catalogService.createOtherSport(otherSport).handle(
            onFailure = { handleSponsorError(it) },
            onSuccess = { ResponseEntity.status(HttpStatus.CREATED).body(it) },
        )
    }

    @PutMapping(Uris.SponsorshipCatalog.OTHER_SPORT_BY_ID)
    fun updateOtherSport(
        authenticatedUser: AuthenticatedUser,
        @PathVariable sportId: Long,
        @RequestBody otherSport: OtherSport,
    ): ResponseEntity<*> {
        requireCatalogManager(authenticatedUser)?.let { return it }
        return catalogService.updateOtherSport(otherSport.copy(sportId = sportId)).handle(
            onFailure = { handleSponsorError(it) },
            onSuccess = { ResponseEntity.ok(it) },
        )
    }

    @DeleteMapping(Uris.SponsorshipCatalog.OTHER_SPORT_BY_ID)
    fun deactivateOtherSport(
        authenticatedUser: AuthenticatedUser,
        @PathVariable sportId: Long,
    ): ResponseEntity<*> {
        requireCatalogManager(authenticatedUser)?.let { return it }
        return catalogService.deactivateOtherSport(sportId).handle(
            onFailure = { handleSponsorError(it) },
            onSuccess = { ResponseEntity.noContent().build() },
        )
    }

    @PutMapping(Uris.SponsorshipCatalog.OTHER_SPORTS_REORDER)
    fun reorderOtherSports(
        authenticatedUser: AuthenticatedUser,
        @RequestBody request: ReorderRequest,
    ): ResponseEntity<*> {
        requireCatalogManager(authenticatedUser)?.let { return it }
        return catalogService.reorderOtherSports(request.ids).handle(
            onFailure = { handleSponsorError(it) },
            onSuccess = { ResponseEntity.ok(it) },
        )
    }

    private fun requireCatalogManager(authenticatedUser: AuthenticatedUser): ResponseEntity<Any>? =
        if (authenticatedUser.canManageBackoffice()) {
            null
        } else {
            Problem.Unauthorized("Not authorized").response(HttpStatus.UNAUTHORIZED)
        }

    private fun handleSponsorError(error: SponsorError): ResponseEntity<Any> =
        when (error) {
            is SponsorError.ValidationError -> Problem.ValidationError(error.message).response(HttpStatus.BAD_REQUEST)
            is SponsorError.InvalidTransition ->
                Problem
                    .InvalidTransition(
                        error.from.toString(),
                        error.attempted,
                    ).response(HttpStatus.BAD_REQUEST)
            is SponsorError.DomainError ->
                when {
                    error.message.contains("not authorized", ignoreCase = true) ->
                        Problem.Unauthorized(error.message).response(HttpStatus.UNAUTHORIZED)
                    error.message.contains(
                        "not found",
                        ignoreCase = true,
                    ) -> Problem.ValidationError(error.message).response(HttpStatus.NOT_FOUND)
                    else -> Problem.ValidationError(error.message).response(HttpStatus.BAD_REQUEST)
                }
        }
}
