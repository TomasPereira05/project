package pt.isel

import org.jdbi.v3.core.Handle

class JdbiTransaction(private val handle: Handle) : Transaction {
    override val memberRepository: MemberRepository = JdbiMemberRepository(handle)
    override val athleteRepository: AthleteRepository = JdbiAthleteRepository(handle)
    override val userRepository: UserRepository = JdbiUserRepository(handle)
    override val eventRepository: EventRepository = JdbiEventRepository(handle)
    override val ticketRepository: TicketRepository = JdbiTicketRepository(handle)
    override val chargeRepository: ChargeRepository = JdbiChargeRepository(handle)
    override val paymentRepository: PaymentRepository = JdbiPaymentRepository(handle)
    override val sponsorRepository: SponsorRepository = JdbiSponsorRepository(handle)
    override val sponsorshipRepository: SponsorshipRepository = JdbiSponsorshipRepository(handle)
}
