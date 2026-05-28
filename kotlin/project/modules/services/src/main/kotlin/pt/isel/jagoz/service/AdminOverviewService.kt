package pt.isel.jagoz.service

import jakarta.inject.Named
import pt.isel.jagoz.domain.athlete.AthleteStatus
import pt.isel.jagoz.domain.member.MemberStatus
import pt.isel.jagoz.domain.sponsor.SponsorError
import pt.isel.jagoz.domain.sponsor.SponsorshipStatus
import pt.isel.jagoz.domain.user.AuthenticatedUser
import pt.isel.jagoz.domain.user.canManageBackoffice
import pt.isel.jagoz.domain.utils.Either
import pt.isel.jagoz.domain.utils.failure
import pt.isel.jagoz.domain.utils.success
import pt.isel.jagoz.repository.TransactionManager

data class AdminOverviewStats(
    val totalMembers: Long,
    val activeMembers: Long,
    val pendingMembers: Long,
    val totalAthletes: Long,
    val activeAthletes: Long,
    val pendingAthletes: Long,
    val totalSponsorships: Long,
    val pendingSponsorships: Long,
)

typealias AdminOverviewStatsResult = Either<SponsorError, AdminOverviewStats>

@Named
class AdminOverviewService(
    private val transactionManager: TransactionManager,
) {
    fun getStats(authenticatedUser: AuthenticatedUser): AdminOverviewStatsResult {
        if (!authenticatedUser.canManageBackoffice()) {
            return failure(SponsorError.DomainError("Not authorized"))
        }

        return transactionManager.run { transaction ->
            success(
                AdminOverviewStats(
                    totalMembers = transaction.memberRepository.countAll(),
                    activeMembers = transaction.memberRepository.countByStatus(MemberStatus.ATIVO),
                    pendingMembers = transaction.memberRepository.countByStatus(MemberStatus.PENDENTE),
                    totalAthletes = transaction.athleteRepository.countAll(),
                    activeAthletes = transaction.athleteRepository.countByStatus(AthleteStatus.ATIVO),
                    pendingAthletes = transaction.athleteRepository.countByStatus(AthleteStatus.PENDENTE),
                    totalSponsorships = transaction.sponsorshipRepository.countAll(),
                    pendingSponsorships = transaction.sponsorshipRepository.countByStatus(SponsorshipStatus.SUBMETIDO),
                ),
            )
        }
    }
}
