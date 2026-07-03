package pt.isel.jagoz.repository

/**
 * Provides access to all repositories within a single database transaction.
 * The JDBI implementation will attach each repository to the same Handle.
 */
interface Transaction {
    val auditLogRepository: AuditLogRepository

    val memberRepository: MemberRepository

    val athleteRepository: AthleteRepository

    val userRepository: UserRepository

    val eventRepository: EventRepository

    val ticketRepository: TicketRepository

    val chargeRepository: ChargeRepository

    val chargeItemRepository: ChargeItemRepository

    val paymentRepository: PaymentRepository

    val sponsorRepository: SponsorRepository

    val sponsorshipRepository: SponsorshipRepository

    val equipmentPlacementRepository: EquipmentPlacementRepository

    val otherSportRepository: OtherSportRepository

    val pubOptionRepository: PubOptionRepository

    val teamCategoryRepository: TeamCategoryRepository

    val teamCategoryPriceOverrideRepository: TeamCategoryPriceOverrideRepository

    val teamGroupPriceRepository: TeamGroupPriceRepository

    val teamGroupRepository: TeamGroupRepository

    val fileRepository: FileRepository

    val trainingScheduleRepository: TrainingScheduleRepository

    val seasonRepository: SeasonRepository

    val emailNotificationLogRepository: EmailNotificationLogRepository
}
