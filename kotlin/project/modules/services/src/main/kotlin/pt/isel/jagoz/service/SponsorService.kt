package pt.isel.jagoz.service

import jakarta.inject.Named
import pt.isel.jagoz.domain.sponsor.Sponsor
import pt.isel.jagoz.domain.sponsor.SponsorDomain
import pt.isel.jagoz.domain.sponsor.SponsorError
import pt.isel.jagoz.domain.utils.Either
import pt.isel.jagoz.repository.TransactionManager

typealias SponsorResult = Either<SponsorError, Sponsor>

@Named
class SponsorService(
    private val transactionManager: TransactionManager,
    private val sponsorDomain: SponsorDomain,
)
