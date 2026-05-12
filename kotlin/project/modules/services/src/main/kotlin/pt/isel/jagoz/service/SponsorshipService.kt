package pt.isel.jagoz.service

import jakarta.inject.Named
import pt.isel.jagoz.domain.sponsor.SponsorDomain
import pt.isel.jagoz.domain.sponsor.SponsorError
import pt.isel.jagoz.domain.sponsor.SponsorType
import pt.isel.jagoz.domain.sponsor.Sponsor
import pt.isel.jagoz.domain.sponsor.Sponsorship
import pt.isel.jagoz.domain.user.AuthenticatedUser
import pt.isel.jagoz.domain.user.canManageBackoffice
import pt.isel.jagoz.domain.utils.Either
import pt.isel.jagoz.domain.utils.failure
import pt.isel.jagoz.domain.utils.success
import pt.isel.jagoz.repository.Transaction
import pt.isel.jagoz.repository.TransactionManager

data class SponsorshipWithSponsor(
    val sponsor: pt.isel.jagoz.domain.sponsor.Sponsor,
    val sponsorship: Sponsorship,
)

@Named
class SponsorshipService(
    private val transactionManager: TransactionManager,
    private val sponsorDomain: SponsorDomain,
) {
    fun createSponsorship(
        authenticatedUser: AuthenticatedUser,
        sponsorship: Sponsorship,
    ): SponsorshipResult {
        if (!authenticatedUser.canManageBackoffice()) {
            return failure(SponsorError.DomainError("Not authorized"))
        }
        return transactionManager.run { transaction ->
            createValidatedSponsorship(transaction, sponsorship)
        }
    }

    fun createSponsorship(sponsorship: Sponsorship): SponsorshipResult =
        transactionManager.run { transaction ->
            createValidatedSponsorship(transaction, sponsorship)
        }

    fun createSponsorshipWithSponsor(
        authenticatedUser: AuthenticatedUser,
        sponsor: Sponsor,
        sponsorship: Sponsorship,
        requestedUserId: Long?,
    ): SponsorshipResult =
        transactionManager.run { transaction ->
            when (val validatedSponsor = sponsorDomain.validateForCreation(sponsor)) {
                is Either.Left -> return@run validatedSponsor
                is Either.Right -> {
                    val existingSponsor =
                        transaction.sponsorRepository.findByNif(validatedSponsor.value.nif)

                    val userIdToAssociate =
                        if (authenticatedUser.canManageBackoffice()) requestedUserId else authenticatedUser.userId

                    if (userIdToAssociate != null && transaction.userRepository.findById(userIdToAssociate) == null) {
                        return@run failure(SponsorError.DomainError("User $userIdToAssociate not found"))
                    }

                    val sponsorId =
                        if (existingSponsor != null) {
                            if (
                                !authenticatedUser.canManageBackoffice() &&
                                existingSponsor.userId != null &&
                                existingSponsor.userId != userIdToAssociate
                            ) {
                                return@run failure(SponsorError.ValidationError("Sponsor is already associated with another account"))
                            }

                            if (authenticatedUser.canManageBackoffice() && userIdToAssociate != null && existingSponsor.userId != userIdToAssociate) {
                                transaction.sponsorRepository.updateUserId(existingSponsor.sponsorId, userIdToAssociate)
                            } else if (userIdToAssociate != null && existingSponsor.userId == null) {
                                transaction.sponsorRepository.updateUserId(existingSponsor.sponsorId, userIdToAssociate)
                            }
                            existingSponsor.sponsorId
                        } else {
                            transaction.sponsorRepository.save(validatedSponsor.value.copy(userId = userIdToAssociate))
                        }

                    createValidatedSponsorship(transaction, sponsorship.copy(sponsorId = sponsorId))
                }
            }
        }

    private fun createValidatedSponsorship(
        transaction: Transaction,
        sponsorship: Sponsorship,
    ): SponsorshipResult {
        val sponsor =
            transaction.sponsorRepository.findById(sponsorship.sponsorId)
                ?: return failure(SponsorError.DomainError("Sponsor ${sponsorship.sponsorId} not found"))

        when (val validatedSponsor = sponsorDomain.validateForCreation(sponsor)) {
            is Either.Left -> return validatedSponsor
            is Either.Right -> Unit
        }

        return when (val enriched = enrichWithPricing(transaction, sponsorship)) {
            is Either.Left -> enriched
            is Either.Right -> {
                when (val validated = sponsorDomain.validateForCreation(enriched.value)) {
                    is Either.Left -> validated
                    is Either.Right -> {
                        if (validated.value.type == SponsorType.PUB) {
                            val pubOptionId = validated.value.pubOptionId
                                ?: return failure(SponsorError.ValidationError("pubOptionId required for PUB"))
                            if (!transaction.pubOptionRepository.reserve(pubOptionId)) {
                                return failure(SponsorError.DomainError("No free spaces for pub option $pubOptionId"))
                            }
                        }
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

    fun getSponsorshipByIdForUser(
        sponsorshipId: Long,
        authenticatedUser: AuthenticatedUser,
    ): SponsorshipResult =
        transactionManager.run { transaction ->
            val sponsorship =
                transaction.sponsorshipRepository.findById(sponsorshipId)
                    ?: return@run failure(SponsorError.DomainError("Sponsorship $sponsorshipId not found"))

            if (!canAccessSponsorship(transaction, authenticatedUser, sponsorship)) {
                return@run failure(SponsorError.DomainError("Sponsorship $sponsorshipId not found"))
            }

            success(sponsorship)
        }

    fun getSponsorshipsBySponsorId(sponsorId: Long): Either<SponsorError, List<Sponsorship>> =
        transactionManager.run { transaction ->
            if (!transaction.sponsorRepository.existsById(sponsorId)) {
                return@run failure(SponsorError.DomainError("Sponsor $sponsorId not found"))
            }

            success(transaction.sponsorshipRepository.findBySponsorId(sponsorId))
        }

    fun getSponsorshipsBySponsorIdForUserPage(
        sponsorId: Long,
        authenticatedUser: AuthenticatedUser,
        page: Int,
        size: Int,
    ): Either<SponsorError, Page<Sponsorship>> =
        transactionManager.run { transaction ->
            val sponsor =
                transaction.sponsorRepository.findById(sponsorId)
                    ?: return@run failure(SponsorError.DomainError("Sponsor $sponsorId not found"))

            if (!authenticatedUser.canManageBackoffice() && !canAccessSponsor(authenticatedUser, sponsor)) {
                return@run failure(SponsorError.DomainError("Sponsor $sponsorId not found"))
            }

            val request = pageRequest(page, size)
            success(
                pageOf(
                    items = transaction.sponsorshipRepository.findPageBySponsorId(sponsorId, request.size, request.offset),
                    request = request,
                    total = transaction.sponsorshipRepository.countBySponsorId(sponsorId),
                ),
            )
        }

    fun getSponsorshipsBySponsorIdForUser(
        sponsorId: Long,
        authenticatedUser: AuthenticatedUser,
    ): Either<SponsorError, List<Sponsorship>> =
        transactionManager.run { transaction ->
            val sponsor =
                transaction.sponsorRepository.findById(sponsorId)
                    ?: return@run failure(SponsorError.DomainError("Sponsor $sponsorId not found"))

            if (!authenticatedUser.canManageBackoffice() && !canAccessSponsor(authenticatedUser, sponsor)) {
                return@run failure(SponsorError.DomainError("Sponsor $sponsorId not found"))
            }

            success(transaction.sponsorshipRepository.findBySponsorId(sponsorId))
        }

    fun getSponsorshipsForUser(authenticatedUser: AuthenticatedUser): Either<SponsorError, List<Sponsorship>> =
        transactionManager.run { transaction ->
            if (authenticatedUser.canManageBackoffice()) {
                return@run success(transaction.sponsorshipRepository.findAll())
            }

            val sponsors =
                transaction.sponsorRepository.findByUserId(authenticatedUser.userId)
                    .ifEmpty { transaction.sponsorRepository.findByEmail(authenticatedUser.email) }
            val sponsorships = sponsors.flatMap { transaction.sponsorshipRepository.findBySponsorId(it.sponsorId) }

            success(sponsorships.sortedByDescending { it.sponsorshipId })
        }

    fun getSponsorshipsForUserPage(
        authenticatedUser: AuthenticatedUser,
        page: Int,
        size: Int,
    ): Either<SponsorError, Page<Sponsorship>> =
        transactionManager.run { transaction ->
            val request = pageRequest(page, size)
            if (authenticatedUser.canManageBackoffice()) {
                return@run success(
                    pageOf(
                        items = transaction.sponsorshipRepository.findPage(request.size, request.offset),
                        request = request,
                        total = transaction.sponsorshipRepository.countAll(),
                    ),
                )
            }

            val sponsors =
                transaction.sponsorRepository.findByUserId(authenticatedUser.userId)
                    .ifEmpty { transaction.sponsorRepository.findByEmail(authenticatedUser.email) }
            val sponsorships =
                sponsors
                    .flatMap { transaction.sponsorshipRepository.findBySponsorId(it.sponsorId) }
                    .sortedByDescending { it.sponsorshipId }

            success(
                pageOf(
                    items = sponsorships.drop(request.offset).take(request.size),
                    request = request,
                    total = sponsorships.size.toLong(),
                ),
            )
        }

    fun getAllSponsorshipsWithSponsorsPage(
        authenticatedUser: AuthenticatedUser,
        page: Int,
        size: Int,
    ): Either<SponsorError, Page<SponsorshipWithSponsor>> =
        transactionManager.run { transaction ->
            if (!authenticatedUser.canManageBackoffice()) {
                return@run failure(SponsorError.DomainError("Not authorized"))
            }

            val request = pageRequest(page, size)
            val sponsorships = transaction.sponsorshipRepository.findPage(request.size, request.offset)
            val sponsors =
                sponsorships
                    .mapNotNull { sponsorship -> transaction.sponsorRepository.findById(sponsorship.sponsorId) }
                    .associateBy { it.sponsorId }

            success(
                pageOf(
                    items =
                        sponsorships.mapNotNull { sponsorship ->
                            sponsors[sponsorship.sponsorId]?.let { sponsor ->
                                SponsorshipWithSponsor(sponsor, sponsorship)
                            }
                        },
                    request = request,
                    total = transaction.sponsorshipRepository.countAll(),
                ),
            )
        }

    fun approveSponsorship(
        authenticatedUser: AuthenticatedUser,
        sponsorshipId: Long,
    ): SponsorshipResult {
        if (!authenticatedUser.canManageBackoffice()) return failure(SponsorError.DomainError("Not authorized"))
        return transitionSponsorship(sponsorshipId) { sponsorDomain.approveSponsorship(it) }
    }

    fun markSponsorshipPaid(
        authenticatedUser: AuthenticatedUser,
        sponsorshipId: Long,
    ): SponsorshipResult {
        if (!authenticatedUser.canManageBackoffice()) return failure(SponsorError.DomainError("Not authorized"))
        return transitionSponsorship(sponsorshipId) { sponsorDomain.markPaid(it) }
    }

    fun cancelSponsorship(
        authenticatedUser: AuthenticatedUser,
        sponsorshipId: Long,
    ): SponsorshipResult {
        if (!authenticatedUser.canManageBackoffice()) return failure(SponsorError.DomainError("Not authorized"))
        return transitionSponsorship(sponsorshipId) { sponsorDomain.cancelSponsorship(it) }
    }

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
                    if (
                        sponsorship.type == SponsorType.PUB &&
                        sponsorship.status != updated.value.status &&
                        updated.value.status.name == "CANCELADO"
                    ) {
                        sponsorship.pubOptionId?.let { transaction.pubOptionRepository.release(it) }
                    }
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
                val pubOption =
                    transaction.pubOptionRepository.findById(pubOptionId)
                        ?: return failure(SponsorError.DomainError("Pub option $pubOptionId not found"))

                success(
                    sponsorship.copy(
                        price = pubOption.price,
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

                val category =
                    transaction.teamCategoryRepository.findById(teamCategoryId)
                        ?: return failure(SponsorError.DomainError("Team category $teamCategoryId not found"))

                val placement =
                    transaction.equipmentPlacementRepository.findById(placementId)
                        ?: return failure(SponsorError.DomainError("Placement $placementId not found"))

                val groupId = category.teamGroupId

                val price =
                    transaction.teamCategoryPriceOverrideRepository
                        .find(teamCategoryId, placementId)?.price
                        ?: transaction.teamGroupPriceRepository
                            .find(groupId, placementId)?.price
                        ?: return failure(
                            SponsorError.DomainError(
                                "No price configured for group $groupId or category $teamCategoryId and placement $placementId",
                            ),
                        )

                success(
                    sponsorship.copy(
                        price = price,
                    ),
                )
            }

            SponsorType.OTHER -> {
                val sportId =
                    sponsorship.sportId
                        ?: return failure(SponsorError.ValidationError("sportId required for OTHER"))
                val otherSport =
                    transaction.otherSportRepository.findById(sportId)
                        ?: return failure(SponsorError.DomainError("Other sport $sportId not found"))

                success(
                    sponsorship.copy(
                        price = otherSport.price,
                    ),
                )
            }
        }
    }

    private fun canAccessSponsorship(
        transaction: Transaction,
        authenticatedUser: AuthenticatedUser,
        sponsorship: Sponsorship,
    ): Boolean {
        if (authenticatedUser.canManageBackoffice()) {
            return true
        }

        val sponsor = transaction.sponsorRepository.findById(sponsorship.sponsorId) ?: return false
        return canAccessSponsor(authenticatedUser, sponsor)
    }

    private fun canAccessSponsor(
        authenticatedUser: AuthenticatedUser,
        sponsor: Sponsor,
    ): Boolean =
        sponsor.userId == authenticatedUser.userId || sponsor.email.equals(authenticatedUser.email, ignoreCase = true)
}
