package pt.isel.jagoz.service

import jakarta.inject.Named
import pt.isel.jagoz.domain.sponsor.SponsorDomain
import pt.isel.jagoz.domain.sponsor.SponsorError
import pt.isel.jagoz.domain.sponsor.SponsorType
import pt.isel.jagoz.domain.sponsor.Sponsorship
import pt.isel.jagoz.domain.utils.Either
import pt.isel.jagoz.domain.utils.failure
import pt.isel.jagoz.domain.utils.success
import pt.isel.jagoz.repository.Transaction
import pt.isel.jagoz.repository.TransactionManager

@Named
class SponsorshipService(
    private val transactionManager: TransactionManager,
    private val sponsorDomain: SponsorDomain,
) {
    fun createSponsorship(sponsorship: Sponsorship): SponsorshipResult =
        transactionManager.run { transaction ->
            if (!transaction.sponsorRepository.existsById(sponsorship.sponsorId)) {
                return@run failure(SponsorError.DomainError("Sponsor ${sponsorship.sponsorId} not found"))
            }

            when (val enriched = enrichWithPricing(transaction, sponsorship)) {
                is Either.Left -> enriched
                is Either.Right -> {
                    when (val validated = sponsorDomain.validateForCreation(enriched.value)) {
                        is Either.Left -> validated
                        is Either.Right -> {
                            val sponsorshipId = transaction.sponsorshipRepository.save(validated.value)
                            success(validated.value.copy(sponsorshipId = sponsorshipId))
                        }
                    }
                }
            }
        }

    fun getSponsorshipById(sponsorshipId: Long): SponsorshipResult =
        transactionManager.run { transaction ->
            val sponsorship =
                transaction.sponsorshipRepository.findById(sponsorshipId)
                    ?: return@run failure(SponsorError.DomainError("Sponsorship $sponsorshipId not found"))

            success(sponsorship)
        }

    fun getSponsorshipsBySponsorId(sponsorId: Long): Either<SponsorError, List<Sponsorship>> =
        transactionManager.run { transaction ->
            if (!transaction.sponsorRepository.existsById(sponsorId)) {
                return@run failure(SponsorError.DomainError("Sponsor $sponsorId not found"))
            }

            success(transaction.sponsorshipRepository.findBySponsorId(sponsorId))
        }

    fun approveSponsorship(sponsorshipId: Long): SponsorshipResult =
        transitionSponsorship(sponsorshipId) { sponsorDomain.approveSponsorship(it) }

    fun markSponsorshipPaid(sponsorshipId: Long): SponsorshipResult =
        transitionSponsorship(sponsorshipId) { sponsorDomain.markPaid(it) }

    fun cancelSponsorship(sponsorshipId: Long): SponsorshipResult =
        transitionSponsorship(sponsorshipId) { sponsorDomain.cancelSponsorship(it) }

    private fun transitionSponsorship(
        sponsorshipId: Long,
        transition: (Sponsorship) -> SponsorshipResult,
    ): SponsorshipResult =
        transactionManager.run { transaction ->
            val sponsorship =
                transaction.sponsorshipRepository.findById(sponsorshipId)
                    ?: return@run failure(SponsorError.DomainError("Sponsorship $sponsorshipId not found"))

            when (val updated = transition(sponsorship)) {
                is Either.Left -> updated
                is Either.Right -> {
                    transaction.sponsorshipRepository.update(updated.value)
                    success(updated.value)
                }
            }
        }

    private fun enrichWithPricing(
        transaction: Transaction,
        sponsorship: Sponsorship,
    ): SponsorshipResult {
        return when (sponsorship.type) {
            SponsorType.PUB -> {
                val pubOptionId =
                    sponsorship.pubOptionId
                        ?: return failure(SponsorError.ValidationError("pubOptionId required for PUB"))
                if (transaction.pubOptionRepository.findById(pubOptionId) == null) {
                    return failure(SponsorError.DomainError("Pub option $pubOptionId not found"))
                }
                val price =
                    transaction.pubOptionPriceRepository.findByPubOptionId(pubOptionId)
                        ?: return failure(SponsorError.DomainError("Price not configured for pub option $pubOptionId"))

                success(
                    sponsorship.copy(
                        price = price.price,
                        pubPriceId = price.pubOptionId,
                        teamPriceId = null,
                        sportPriceId = null,
                    ),
                )
            }

            SponsorType.TEAM -> {
                val teamCategoryId =
                    sponsorship.teamCategoryId
                        ?: return failure(SponsorError.ValidationError("teamCategoryId required for TEAM"))
                val placementId =
                    sponsorship.placementId
                        ?: return failure(SponsorError.ValidationError("placementId required for TEAM"))
                if (transaction.teamCategoryRepository.findById(teamCategoryId) == null) {
                    return failure(SponsorError.DomainError("Team category $teamCategoryId not found"))
                }
                if (transaction.equipmentPlacementRepository.findById(placementId) == null) {
                    return failure(SponsorError.DomainError("Placement $placementId not found"))
                }
                val price =
                    transaction.teamSponsorshipPriceRepository.findByTeamCategoryAndPlacement(teamCategoryId, placementId)
                        ?: return failure(
                            SponsorError.DomainError(
                                "Price not configured for teamCategory $teamCategoryId and placement $placementId",
                            ),
                        )

                success(
                    sponsorship.copy(
                        price = price.price,
                        teamPriceId = price.id,
                        pubPriceId = null,
                        sportPriceId = null,
                    ),
                )
            }

            SponsorType.OTHER -> {
                val sportId =
                    sponsorship.sportId
                        ?: return failure(SponsorError.ValidationError("sportId required for OTHER"))
                if (transaction.otherSportRepository.findById(sportId) == null) {
                    return failure(SponsorError.DomainError("Other sport $sportId not found"))
                }
                val price =
                    transaction.otherSportPriceRepository.findBySportId(sportId)
                        ?: return failure(SponsorError.DomainError("Price not configured for other sport $sportId"))

                success(
                    sponsorship.copy(
                        price = price.price,
                        sportPriceId = price.sportId,
                        pubPriceId = null,
                        teamPriceId = null,
                    ),
                )
            }
        }
    }
}
