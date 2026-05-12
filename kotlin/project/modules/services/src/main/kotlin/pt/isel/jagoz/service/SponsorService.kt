package pt.isel.jagoz.service

import jakarta.inject.Named
import pt.isel.jagoz.domain.sponsor.Sponsor
import pt.isel.jagoz.domain.sponsor.SponsorDomain
import pt.isel.jagoz.domain.sponsor.SponsorError
import pt.isel.jagoz.domain.user.AuthenticatedUser
import pt.isel.jagoz.domain.user.Role
import pt.isel.jagoz.domain.utils.Either
import pt.isel.jagoz.domain.utils.failure
import pt.isel.jagoz.domain.utils.success
import pt.isel.jagoz.repository.TransactionManager

@Named
class SponsorService(
    private val transactionManager: TransactionManager,
    private val sponsorDomain: SponsorDomain,
) {
    fun createSponsor(sponsor: Sponsor): SponsorResult =
        transactionManager.run { transaction ->
            when (val validated = sponsorDomain.validateForCreation(sponsor)) {
                is Either.Left -> validated
                is Either.Right -> {
                    if (transaction.sponsorRepository.existsByNif(validated.value.nif)) {
                        return@run failure(SponsorError.DomainError("Sponsor with nif ${validated.value.nif} already exists"))
                    }

                    val sponsorId = transaction.sponsorRepository.save(validated.value)
                    success(validated.value.copy(sponsorId = sponsorId))
                }
            }
        }

    fun createSponsor(
        authenticatedUser: AuthenticatedUser,
        sponsor: Sponsor,
    ): SponsorResult {
        if (!canManageSponsors(authenticatedUser)) {
            return failure(SponsorError.DomainError("Not authorized"))
        }
        return createSponsor(sponsor)
    }

    fun getSponsorById(sponsorId: Long): SponsorResult =
        transactionManager.run { transaction ->
            val sponsor =
                transaction.sponsorRepository.findById(sponsorId)
                    ?: return@run failure(SponsorError.DomainError("Sponsor $sponsorId not found"))

            success(sponsor)
        }

    fun getSponsorById(
        authenticatedUser: AuthenticatedUser,
        sponsorId: Long,
    ): SponsorResult =
        transactionManager.run { transaction ->
            val sponsor =
                transaction.sponsorRepository.findById(sponsorId)
                    ?: return@run failure(SponsorError.DomainError("Sponsor $sponsorId not found"))

            if (!canManageSponsors(authenticatedUser) && sponsor.userId != authenticatedUser.userId) {
                return@run failure(SponsorError.DomainError("Sponsor $sponsorId not found"))
            }

            success(sponsor)
        }

    fun getAllSponsors(): List<Sponsor> =
        transactionManager.run { transaction ->
            transaction.sponsorRepository.findAll()
        }

    fun getSponsorsPage(
        authenticatedUser: AuthenticatedUser,
        page: Int,
        size: Int,
    ): Either<SponsorError, Page<Sponsor>> {
        if (!canManageSponsors(authenticatedUser)) {
            return failure(SponsorError.DomainError("Not authorized"))
        }
        val request = pageRequest(page, size)
        return transactionManager.run { transaction ->
            success(
                pageOf(
                    items = transaction.sponsorRepository.findPage(request.size, request.offset),
                    request = request,
                    total = transaction.sponsorRepository.countAll(),
                ),
            )
        }
    }

    fun updateSponsor(
        authenticatedUser: AuthenticatedUser,
        sponsorId: Long,
        name: String,
        email: String,
        phone: String,
        nif: String,
    ): SponsorResult {
        if (!canManageSponsors(authenticatedUser)) {
            return failure(SponsorError.DomainError("Not authorized"))
        }
        return updateSponsor(sponsorId, name, email, phone, nif)
    }

    fun updateSponsor(
        sponsorId: Long,
        name: String,
        email: String,
        phone: String,
        nif: String,
    ): SponsorResult =
        transactionManager.run { transaction ->
            val sponsor =
                transaction.sponsorRepository.findById(sponsorId)
                    ?: return@run failure(SponsorError.DomainError("Sponsor $sponsorId not found"))

            when (val updated = sponsorDomain.updateSponsor(sponsor, name, email, phone, nif)) {
                is Either.Left -> updated
                is Either.Right -> {
                    val updatedSponsor = updated.value
                    transaction.sponsorRepository.update(updatedSponsor)
                    success(updatedSponsor)
                }
            }
        }

    fun assignUserToSponsor(
        authenticatedUser: AuthenticatedUser,
        sponsorId: Long,
        userId: Long?,
    ): SponsorResult {
        if (!canManageSponsors(authenticatedUser)) {
            return failure(SponsorError.DomainError("Not authorized"))
        }

        return transactionManager.run { transaction ->
            val sponsor =
                transaction.sponsorRepository.findById(sponsorId)
                    ?: return@run failure(SponsorError.DomainError("Sponsor $sponsorId not found"))

            if (userId != null && transaction.userRepository.findById(userId) == null) {
                return@run failure(SponsorError.DomainError("User $userId not found"))
            }

            transaction.sponsorRepository.updateUserId(sponsorId, userId)
            success(sponsor.copy(userId = userId))
        }
    }

    fun claimSponsor(
        authenticatedUser: AuthenticatedUser,
        nif: String,
        email: String,
        phone: String,
    ): SponsorResult =
        transactionManager.run { transaction ->
            val sponsor =
                transaction.sponsorRepository.findByNif(nif.trim())
                    ?: return@run failure(SponsorError.DomainError("Sponsor not found for provided data"))

            if (!sponsor.email.equals(email.trim(), ignoreCase = true) || sponsor.phone.trim() != phone.trim()) {
                return@run failure(SponsorError.ValidationError("Provided data does not match sponsor records"))
            }

            if (sponsor.userId != null && sponsor.userId != authenticatedUser.userId) {
                return@run failure(SponsorError.ValidationError("Sponsor is already associated with another account"))
            }

            transaction.sponsorRepository.updateUserId(sponsor.sponsorId, authenticatedUser.userId)
            success(sponsor.copy(userId = authenticatedUser.userId))
        }

    private fun canManageSponsors(authenticatedUser: AuthenticatedUser): Boolean =
        authenticatedUser.role == Role.ADMIN || authenticatedUser.role == Role.SECRETARIA
}
