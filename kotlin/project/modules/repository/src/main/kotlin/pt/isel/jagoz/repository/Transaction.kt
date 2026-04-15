package pt.isel.jagoz.repository

/**
 * Provides access to all repositories within a single database transaction.
 * The JDBI implementation will attach each repository to the same Handle.
 */
interface Transaction {
    val memberRepository: MemberRepository

    val athleteRepository: AthleteRepository

    val userRepository: UserRepository

    val eventRepository: EventRepository

    val ticketRepository: TicketRepository

    val chargeRepository: ChargeRepository

    val paymentRepository: PaymentRepository

    val sponsorRepository: SponsorRepository

    val sponsorshipRepository: SponsorshipRepository
}
