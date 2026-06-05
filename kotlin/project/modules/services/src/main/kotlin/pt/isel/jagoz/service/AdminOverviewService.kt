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
import java.time.LocalDate
import java.time.ZoneId

data class AdminOverviewStats(
    val totalMembers: Long,
    val activeMembers: Long,
    val pendingMembers: Long,
    val totalAthletes: Long,
    val activeAthletes: Long,
    val pendingAthletes: Long,
    val totalSponsorships: Long,
    val pendingSponsorships: Long,
    val approvedUnpaidSponsorships: Long,
    val pendingCharges: Long,
    val todayTrainingSchedules: Long,
    val activeSeason: String?,
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
            val activeSeason = transaction.seasonRepository.findActive()
            val todayWeekday = LocalDate.now(ZoneId.of("Europe/Lisbon")).dayOfWeek.value
            val todayTrainingSchedules =
                activeSeason?.let { season ->
                    transaction.trainingScheduleRepository
                        .findAll(season.name, true)
                        .count { it.schedule.weekday == todayWeekday }
                        .toLong()
                } ?: 0L

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
                    approvedUnpaidSponsorships = transaction.sponsorshipRepository.countByStatus(SponsorshipStatus.APROVADO),
                    pendingCharges = transaction.chargeRepository.countPending(),
                    todayTrainingSchedules = todayTrainingSchedules,
                    activeSeason = activeSeason?.name,
                ),
            )
        }
    }
}
