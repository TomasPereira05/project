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
import pt.isel.jagoz.domain.team.TeamCategory
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
    fun createPubOption(@RequestBody pubOption: PubOption): ResponseEntity<*> =
        catalogService.createPubOption(pubOption).handle(
            onFailure = { handleSponsorError(it) },
            onSuccess = { ResponseEntity.status(HttpStatus.CREATED).body(it) },
        )

    @PutMapping(Uris.SponsorshipCatalog.PUB_OPTION_BY_ID)
    fun updatePubOption(
        @PathVariable pubOptionId: Long,
        @RequestBody pubOption: PubOption,
    ): ResponseEntity<*> =
        catalogService.updatePubOption(pubOption.copy(pubId = pubOptionId)).handle(
            onFailure = { handleSponsorError(it) },
            onSuccess = { ResponseEntity.ok(it) },
        )

    @DeleteMapping(Uris.SponsorshipCatalog.PUB_OPTION_BY_ID)
    fun deactivatePubOption(@PathVariable pubOptionId: Long): ResponseEntity<*> =
        catalogService.deactivatePubOption(pubOptionId).handle(
            onFailure = { handleSponsorError(it) },
            onSuccess = { ResponseEntity.noContent().build() },
        )

    @PutMapping(Uris.SponsorshipCatalog.PUB_OPTIONS_REORDER)
    fun reorderPubOptions(@RequestBody request: ReorderRequest): ResponseEntity<*> =
        catalogService.reorderPubOptions(request.ids).handle(
            onFailure = { handleSponsorError(it) },
            onSuccess = { ResponseEntity.ok(it) },
        )

    @GetMapping(Uris.SponsorshipCatalog.EQUIPMENT_PLACEMENTS_ACTIVE)
    fun getActiveEquipmentPlacements() = ResponseEntity.ok(catalogService.getActiveEquipmentPlacements())

    @PostMapping(Uris.SponsorshipCatalog.EQUIPMENT_PLACEMENTS)
    fun createEquipmentPlacement(@RequestBody placement: EquipmentPlacement): ResponseEntity<*> =
        catalogService.createEquipmentPlacement(placement).handle(
            onFailure = { handleSponsorError(it) },
            onSuccess = { ResponseEntity.status(HttpStatus.CREATED).body(it) },
        )

    @PutMapping(Uris.SponsorshipCatalog.EQUIPMENT_PLACEMENT_BY_ID)
    fun updateEquipmentPlacement(
        @PathVariable placementId: Long,
        @RequestBody placement: EquipmentPlacement,
    ): ResponseEntity<*> =
        catalogService.updateEquipmentPlacement(placement.copy(equipmentId = placementId)).handle(
            onFailure = { handleSponsorError(it) },
            onSuccess = { ResponseEntity.ok(it) },
        )

    @DeleteMapping(Uris.SponsorshipCatalog.EQUIPMENT_PLACEMENT_BY_ID)
    fun deactivateEquipmentPlacement(@PathVariable placementId: Long): ResponseEntity<*> =
        catalogService.deactivateEquipmentPlacement(placementId).handle(
            onFailure = { handleSponsorError(it) },
            onSuccess = { ResponseEntity.noContent().build() },
        )

    @PutMapping(Uris.SponsorshipCatalog.EQUIPMENT_PLACEMENTS_REORDER)
    fun reorderEquipmentPlacements(@RequestBody request: ReorderRequest): ResponseEntity<*> =
        catalogService.reorderEquipmentPlacements(request.ids).handle(
            onFailure = { handleSponsorError(it) },
            onSuccess = { ResponseEntity.ok(it) },
        )

    @GetMapping(Uris.SponsorshipCatalog.OTHER_SPORTS_ACTIVE)
    fun getActiveOtherSports() = ResponseEntity.ok(catalogService.getActiveOtherSports())

    @PostMapping(Uris.SponsorshipCatalog.OTHER_SPORTS)
    fun createOtherSport(@RequestBody otherSport: OtherSport): ResponseEntity<*> =
        catalogService.createOtherSport(otherSport).handle(
            onFailure = { handleSponsorError(it) },
            onSuccess = { ResponseEntity.status(HttpStatus.CREATED).body(it) },
        )

    @PutMapping(Uris.SponsorshipCatalog.OTHER_SPORT_BY_ID)
    fun updateOtherSport(
        @PathVariable sportId: Long,
        @RequestBody otherSport: OtherSport,
    ): ResponseEntity<*> =
        catalogService.updateOtherSport(otherSport.copy(sportId = sportId)).handle(
            onFailure = { handleSponsorError(it) },
            onSuccess = { ResponseEntity.ok(it) },
        )

    @DeleteMapping(Uris.SponsorshipCatalog.OTHER_SPORT_BY_ID)
    fun deactivateOtherSport(@PathVariable sportId: Long): ResponseEntity<*> =
        catalogService.deactivateOtherSport(sportId).handle(
            onFailure = { handleSponsorError(it) },
            onSuccess = { ResponseEntity.noContent().build() },
        )

    @PutMapping(Uris.SponsorshipCatalog.OTHER_SPORTS_REORDER)
    fun reorderOtherSports(@RequestBody request: ReorderRequest): ResponseEntity<*> =
        catalogService.reorderOtherSports(request.ids).handle(
            onFailure = { handleSponsorError(it) },
            onSuccess = { ResponseEntity.ok(it) },
        )

    private fun handleSponsorError(error: SponsorError): ResponseEntity<Any> =
        when (error) {
            is SponsorError.ValidationError -> Problem.ValidationError(error.message).response(HttpStatus.BAD_REQUEST)
            is SponsorError.InvalidTransition -> Problem.InvalidTransition(error.from.toString(), error.attempted).response(HttpStatus.BAD_REQUEST)
            is SponsorError.DomainError ->
                when {
                    error.message.contains("not found", ignoreCase = true) -> Problem.ValidationError(error.message).response(HttpStatus.NOT_FOUND)
                    else -> Problem.ValidationError(error.message).response(HttpStatus.BAD_REQUEST)
                }
        }
}
