package pt.isel.jagoz.service

import jakarta.inject.Named
import pt.isel.jagoz.domain.sponsor.Sponsor
import pt.isel.jagoz.domain.sponsor.SponsorDomain
import pt.isel.jagoz.domain.sponsor.SponsorError
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

    fun getSponsorById(sponsorId: Long): SponsorResult =
        transactionManager.run { transaction ->
            val sponsor =
                transaction.sponsorRepository.findById(sponsorId)
                    ?: return@run failure(SponsorError.DomainError("Sponsor $sponsorId not found"))

            success(sponsor)
        }

    fun getAllSponsors(): List<Sponsor> =
        transactionManager.run { transaction ->
            transaction.sponsorRepository.findAll()
        }

    fun getSponsorsPage(
        page: Int,
        size: Int,
    ): Page<Sponsor> {
        val request = pageRequest(page, size)
        return transactionManager.run { transaction ->
            pageOf(
                items = transaction.sponsorRepository.findPage(request.size, request.offset),
                request = request,
                total = transaction.sponsorRepository.countAll(),
            )
        }
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
}
