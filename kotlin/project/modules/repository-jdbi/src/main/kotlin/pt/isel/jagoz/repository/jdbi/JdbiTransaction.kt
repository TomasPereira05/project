package pt.isel.jagoz.repository.jdbi

import org.jdbi.v3.core.Handle
import pt.isel.jagoz.repository.AthleteRepository
import pt.isel.jagoz.repository.ChargeRepository
import pt.isel.jagoz.repository.EquipmentPlacementRepository
import pt.isel.jagoz.repository.EventRepository
import pt.isel.jagoz.repository.MemberRepository
import pt.isel.jagoz.repository.OtherSportRepository
import pt.isel.jagoz.repository.PaymentRepository
import pt.isel.jagoz.repository.PubOptionRepository
import pt.isel.jagoz.repository.SponsorRepository
import pt.isel.jagoz.repository.SponsorshipRepository
import pt.isel.jagoz.repository.TeamCategoryPriceOverrideRepository
import pt.isel.jagoz.repository.TeamCategoryRepository
import pt.isel.jagoz.repository.TeamGroupPriceRepository
import pt.isel.jagoz.repository.TeamGroupRepository
import pt.isel.jagoz.repository.TicketRepository
import pt.isel.jagoz.repository.Transaction
import pt.isel.jagoz.repository.UserRepository

class JdbiTransaction(
    private val handle: Handle,
) : Transaction {
    override val memberRepository: MemberRepository = JdbiMemberRepository(handle)
    override val athleteRepository: AthleteRepository = JdbiAthleteRepository(handle)
    override val userRepository: UserRepository = JdbiUserRepository(handle)
    override val eventRepository: EventRepository = JdbiEventRepository(handle)
    override val ticketRepository: TicketRepository = JdbiTicketRepository(handle)
    override val chargeRepository: ChargeRepository = JdbiChargeRepository(handle)
    override val paymentRepository: PaymentRepository = JdbiPaymentRepository(handle)
    override val sponsorRepository: SponsorRepository = JdbiSponsorRepository(handle)
    override val sponsorshipRepository: SponsorshipRepository = JdbiSponsorshipRepository(handle)
    override val equipmentPlacementRepository: EquipmentPlacementRepository = JdbiEquipmentPlacementRepository(handle)
    override val otherSportRepository: OtherSportRepository = JdbiOtherSportRepository(handle)
    override val pubOptionRepository: PubOptionRepository = JdbiPubOptionRepository(handle)
    override val teamCategoryRepository: TeamCategoryRepository = JdbiTeamCategoryRepository(handle)
    override val teamCategoryPriceOverrideRepository: TeamCategoryPriceOverrideRepository = JdbiTeamCategoryPriceOverrideRepository(handle)
    override val teamGroupPriceRepository: TeamGroupPriceRepository = JdbiTeamGroupPriceRepository(handle)
    override val teamGroupRepository: TeamGroupRepository = JdbiTeamGroupRepository(handle)
}
