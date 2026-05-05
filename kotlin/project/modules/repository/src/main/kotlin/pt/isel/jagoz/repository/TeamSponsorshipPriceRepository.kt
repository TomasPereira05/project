package pt.isel.jagoz.repository

import pt.isel.jagoz.domain.sponsor.TeamSponsorshipPrice

interface TeamSponsorshipPriceRepository {
    fun findAll(): List<TeamSponsorshipPrice>

    fun findById(id: Long): TeamSponsorshipPrice?

    fun findByTeamCategoryAndPlacement(
        teamCategoryId: Long,
        placementId: Long,
    ): TeamSponsorshipPrice?

    fun save(price: TeamSponsorshipPrice): Long

    fun update(price: TeamSponsorshipPrice)
}
