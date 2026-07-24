package pt.isel.jagoz.service

import kotlinx.datetime.Instant
import kotlinx.datetime.LocalDate
import pt.isel.jagoz.domain.athlete.Athlete
import pt.isel.jagoz.domain.athlete.AthleteStatus
import pt.isel.jagoz.domain.athlete.Guardian
import pt.isel.jagoz.domain.event.Event
import pt.isel.jagoz.domain.event.EventListFilter
import pt.isel.jagoz.domain.event.EventSector
import pt.isel.jagoz.domain.event.EventStatus
import pt.isel.jagoz.domain.event.Ticket
import pt.isel.jagoz.domain.event.TicketStatus
import pt.isel.jagoz.domain.member.Member
import pt.isel.jagoz.domain.member.MemberCategory
import pt.isel.jagoz.domain.member.MemberStatus
import pt.isel.jagoz.domain.payment.Charge
import pt.isel.jagoz.domain.payment.ChargeItem
import pt.isel.jagoz.domain.payment.ChargeItemWithStatus
import pt.isel.jagoz.domain.payment.ChargeStatus
import pt.isel.jagoz.domain.payment.Payment
import pt.isel.jagoz.domain.payment.PaymentStatus
import pt.isel.jagoz.domain.team.TeamCategory
import pt.isel.jagoz.domain.user.AuthenticatedUser
import pt.isel.jagoz.domain.user.PasswordValidationInfo
import pt.isel.jagoz.domain.user.Role
import pt.isel.jagoz.domain.user.Token
import pt.isel.jagoz.domain.user.TokenValidationInfo
import pt.isel.jagoz.domain.user.User
import pt.isel.jagoz.repository.AthleteRepository
import pt.isel.jagoz.repository.AuditLogRepository
import pt.isel.jagoz.repository.ChargeItemRepository
import pt.isel.jagoz.repository.ChargeRepository
import pt.isel.jagoz.repository.EmailNotificationLogRepository
import pt.isel.jagoz.repository.EquipmentPlacementRepository
import pt.isel.jagoz.repository.EventRepository
import pt.isel.jagoz.repository.FileRepository
import pt.isel.jagoz.repository.MemberRepository
import pt.isel.jagoz.repository.OtherSportRepository
import pt.isel.jagoz.repository.PaymentRepository
import pt.isel.jagoz.repository.PubOptionRepository
import pt.isel.jagoz.repository.SeasonRepository
import pt.isel.jagoz.repository.SponsorRepository
import pt.isel.jagoz.repository.SponsorshipRepository
import pt.isel.jagoz.repository.TeamCategoryPriceOverrideRepository
import pt.isel.jagoz.repository.TeamCategoryRepository
import pt.isel.jagoz.repository.TeamGroupPriceRepository
import pt.isel.jagoz.repository.TeamGroupRepository
import pt.isel.jagoz.repository.TicketRepository
import pt.isel.jagoz.repository.TrainingScheduleRepository
import pt.isel.jagoz.repository.Transaction
import pt.isel.jagoz.repository.TransactionManager
import pt.isel.jagoz.repository.UserRepository

/**
 * Fakes em memória partilhados pelos testes de services. Implementam apenas os métodos
 * que os services exercitam; o resto rebenta com AssertionError para o teste apanhar
 * chamadas inesperadas.
 */
class FakeTransactionManager(
    val tx: FakeTransaction = FakeTransaction(),
) : TransactionManager {
    var runs = 0

    override fun <R> run(block: (Transaction) -> R): R {
        runs++
        return block(tx)
    }
}

class FakeTransaction : Transaction {
    override val memberRepository = InMemoryMemberRepository()
    override val athleteRepository = InMemoryAthleteRepository()
    override val userRepository = InMemoryUserRepository()
    override val chargeRepository = InMemoryChargeRepository()
    override val paymentRepository = InMemoryPaymentRepository()
    override val chargeItemRepository = InMemoryChargeItemRepository(chargeRepository, paymentRepository)
    override val eventRepository = InMemoryEventRepository()
    override val ticketRepository = InMemoryTicketRepository()
    override val teamCategoryRepository = InMemoryTeamCategoryRepository()

    override val auditLogRepository: AuditLogRepository get() = unsupported()
    override val sponsorRepository: SponsorRepository get() = unsupported()
    override val sponsorshipRepository: SponsorshipRepository get() = unsupported()
    override val equipmentPlacementRepository: EquipmentPlacementRepository get() = unsupported()
    override val otherSportRepository: OtherSportRepository get() = unsupported()
    override val pubOptionRepository: PubOptionRepository get() = unsupported()
    override val teamCategoryPriceOverrideRepository: TeamCategoryPriceOverrideRepository get() = unsupported()
    override val teamGroupPriceRepository: TeamGroupPriceRepository get() = unsupported()
    override val teamGroupRepository: TeamGroupRepository get() = unsupported()
    override val fileRepository: FileRepository get() = unsupported()
    override val trainingScheduleRepository: TrainingScheduleRepository get() = unsupported()
    override val seasonRepository: SeasonRepository get() = unsupported()
    override val emailNotificationLogRepository: EmailNotificationLogRepository get() = unsupported()

    private fun <T> unsupported(): T = throw AssertionError("Repository should not be used in this test")
}

private fun <T> unsupported(): T = throw AssertionError("Repository method should not be used in this test")

class InMemoryMemberRepository : MemberRepository {
    val members = mutableMapOf<Long, Member>()
    val updates = mutableListOf<Member>()
    private var nextId = 1L
    private var nextNumber = 1000

    fun seed(member: Member): Member {
        members[member.memberId] = member
        nextId = maxOf(nextId, member.memberId + 1)
        return member
    }

    override fun save(member: Member): Long {
        val id = nextId++
        members[id] = member.copy(memberId = id)
        return id
    }

    override fun update(member: Member) {
        updates += member
        members[member.memberId] = member
    }

    override fun findById(id: Long): Member? = members[id]

    override fun findByIds(ids: List<Long>): List<Member> = ids.mapNotNull { members[it] }

    override fun findByEmail(email: String): Member? = members.values.firstOrNull { it.email == email }

    override fun findByMemberNumber(memberNumber: Int): Member? = members.values.firstOrNull { it.memberNumber == memberNumber }

    override fun existsByNif(nif: String): Boolean = members.values.any { it.nif == nif }

    override fun findAll(): List<Member> = members.values.toList()

    override fun findPage(
        limit: Int,
        offset: Int,
    ): List<Member> = members.values.drop(offset).take(limit)

    override fun countAll(): Long = members.size.toLong()

    override fun countByStatus(status: MemberStatus): Long = members.values.count { it.status == status }.toLong()

    override fun findPageFiltered(
        limit: Int,
        offset: Int,
        search: String?,
        category: MemberCategory?,
        status: MemberStatus?,
    ): List<Member> =
        members.values
            .filter { category == null || it.category == category }
            .filter { status == null || it.status == status }
            .filter { search == null || it.completeName.contains(search, ignoreCase = true) }
            .drop(offset)
            .take(limit)

    override fun countFiltered(
        search: String?,
        category: MemberCategory?,
        status: MemberStatus?,
    ): Long = findPageFiltered(Int.MAX_VALUE, 0, search, category, status).size.toLong()

    override fun findAllActive(): List<Member> = members.values.filter { it.status == MemberStatus.ATIVO }

    override fun nextMemberNumber(): Int = nextNumber++
}

class InMemoryAthleteRepository : AthleteRepository {
    val athletes = mutableMapOf<Long, Athlete>()
    val guardiansByAthlete = mutableMapOf<Long, List<Guardian>>()
    val userAthleteLinks = mutableListOf<Pair<Long, Long>>()
    val updates = mutableListOf<Athlete>()
    private var nextId = 1L

    fun seed(athlete: Athlete): Athlete {
        athletes[athlete.athleteId] = athlete
        nextId = maxOf(nextId, athlete.athleteId + 1)
        return athlete
    }

    override fun findById(id: Long): Athlete? = athletes[id]

    override fun findByMemberId(memberId: Long): Athlete? = athletes.values.firstOrNull { it.memberId == memberId }

    override fun findByManagingUser(userId: Long): List<Athlete> =
        userAthleteLinks.filter { it.first == userId }.mapNotNull { athletes[it.second] }

    override fun linkUserToAthlete(
        userId: Long,
        athleteId: Long,
    ) {
        if (userId to athleteId !in userAthleteLinks) userAthleteLinks += userId to athleteId
    }

    override fun isUserManagingMember(
        userId: Long,
        memberId: Long,
    ): Boolean =
        userAthleteLinks.any { (linkedUser, linkedAthlete) ->
            linkedUser == userId && athletes[linkedAthlete]?.memberId == memberId
        }

    override fun findDuplicateUniqueField(
        niss: String,
        numeroUtente: String,
        bi: String,
    ): String? =
        when {
            athletes.values.any { it.niss == niss } -> "niss"
            athletes.values.any { it.numeroUtente == numeroUtente } -> "numeroUtente"
            athletes.values.any { it.bi == bi } -> "bi"
            else -> null
        }

    override fun findAllActive(): List<Athlete> = athletes.values.filter { it.active }

    override fun findAll(): List<Athlete> = athletes.values.toList()

    override fun findPage(
        limit: Int,
        offset: Int,
    ): List<Athlete> = athletes.values.drop(offset).take(limit)

    override fun countAll(): Long = athletes.size.toLong()

    override fun countByStatus(status: AthleteStatus): Long = unsupported()

    override fun findPageFiltered(
        limit: Int,
        offset: Int,
        search: String?,
        teamCategoryIds: List<Long>,
        statuses: List<AthleteStatus>,
    ): List<Athlete> =
        athletes.values
            .filter { teamCategoryIds.isEmpty() || it.teamCategory.teamId in teamCategoryIds }
            .drop(offset)
            .take(limit)

    override fun countFiltered(
        search: String?,
        teamCategoryIds: List<Long>,
        statuses: List<AthleteStatus>,
    ): Long = findPageFiltered(Int.MAX_VALUE, 0, search, teamCategoryIds, statuses).size.toLong()

    override fun findByTeamCategory(
        teamCategoryId: Long,
        activeOnly: Boolean,
    ): List<Athlete> = athletes.values.filter { it.teamCategory.teamId == teamCategoryId && (!activeOnly || it.active) }

    override fun findByIdWithDetail(id: Long): Athlete? = athletes[id]?.copy(guardians = guardiansByAthlete[id].orEmpty())

    override fun save(athlete: Athlete): Long {
        val id = nextId++
        athletes[id] = athlete.copy(athleteId = id)
        return id
    }

    override fun update(athlete: Athlete) {
        updates += athlete
        athletes[athlete.athleteId] = athlete
    }

    override fun saveGuardians(
        athleteId: Long,
        guardians: List<Guardian>,
    ) {
        guardiansByAthlete[athleteId] = guardians
    }

    override fun deleteGuardiansByAthleteId(athleteId: Long) {
        guardiansByAthlete.remove(athleteId)
    }
}

class InMemoryUserRepository : UserRepository {
    val users = mutableMapOf<Long, User>()
    val tokens = mutableMapOf<TokenValidationInfo, Token>()
    val updates = mutableListOf<User>()
    private var nextId = 1L

    fun seed(user: User): User {
        users[user.userId] = user
        nextId = maxOf(nextId, user.userId + 1)
        return user
    }

    override fun save(user: User): Long {
        val id = nextId++
        users[id] = user.copy(userId = id)
        return id
    }

    override fun updatePassword(
        userId: Long,
        newPassword: PasswordValidationInfo,
    ) {
        users[userId] = users.getValue(userId).copy(passwordValidation = newPassword)
    }

    override fun findById(id: Long): User? = users[id]

    override fun findByUsername(username: String): User? = users.values.firstOrNull { it.username == username }

    override fun findByEmail(email: String): User? = users.values.firstOrNull { it.email == email }

    override fun findPage(
        limit: Int,
        offset: Int,
    ): List<User> = users.values.drop(offset).take(limit)

    override fun countAll(): Long = users.size.toLong()

    override fun findPageFiltered(
        limit: Int,
        offset: Int,
        search: String?,
        role: Role?,
    ): List<User> =
        users.values
            .filter { role == null || it.role == role }
            .filter { search == null || it.username.contains(search, ignoreCase = true) }
            .drop(offset)
            .take(limit)

    override fun countFiltered(
        search: String?,
        role: Role?,
    ): Long = findPageFiltered(Int.MAX_VALUE, 0, search, role).size.toLong()

    override fun update(user: User) {
        updates += user
        users[user.userId] = user
    }

    override fun createToken(token: Token) {
        tokens[token.tokenValidationInfo] = token
    }

    override fun getTokenByValidation(validation: TokenValidationInfo): Pair<User, Token>? =
        tokens[validation]?.let { token -> users[token.userId]?.let { it to token } }

    override fun updateTokenLastUsed(
        token: Token,
        now: Instant,
    ) {
        tokens[token.tokenValidationInfo] = token.copy(lastUsedAt = now)
    }

    override fun removeTokenByValidation(validation: TokenValidationInfo): Int = if (tokens.remove(validation) != null) 1 else 0
}

class InMemoryChargeRepository : ChargeRepository {
    val charges = mutableMapOf<Long, Charge>()
    val updates = mutableListOf<Charge>()
    private var nextId = 1L

    fun seed(charge: Charge): Charge {
        charges[charge.chargeId] = charge
        nextId = maxOf(nextId, charge.chargeId + 1)
        return charge
    }

    override fun findById(id: Long): Charge? = charges[id]

    override fun findByMemberAndSeason(
        memberId: Long,
        season: String,
    ): List<Charge> = charges.values.filter { it.memberId == memberId && it.season == season }

    override fun findPendingByMember(memberId: Long): List<Charge> =
        charges.values.filter { it.memberId == memberId && it.status == ChargeStatus.PENDING }

    override fun findPendingBySponsorship(sponsorshipId: Long): Charge? =
        charges.values.firstOrNull { it.sponsorshipId == sponsorshipId && it.status == ChargeStatus.PENDING }

    override fun countPending(): Long = charges.values.count { it.status == ChargeStatus.PENDING }.toLong()

    override fun existsByMemberSeasonMonth(
        memberId: Long,
        season: String,
        month: Int,
    ): Boolean = charges.values.any { it.memberId == memberId && it.season == season && it.month == month }

    override fun save(charge: Charge): Long {
        val id = nextId++
        charges[id] = charge.copy(chargeId = id)
        return id
    }

    override fun update(charge: Charge) {
        updates += charge
        charges[charge.chargeId] = charge
    }
}

class InMemoryChargeItemRepository(
    private val chargeRepository: InMemoryChargeRepository,
    private val paymentRepository: InMemoryPaymentRepository,
) : ChargeItemRepository {
    val items = mutableMapOf<Long, ChargeItem>()
    private var nextId = 1L

    override fun findByChargeId(chargeId: Long): List<ChargeItem> = items.values.filter { it.chargeId == chargeId }

    override fun findByMember(memberId: Long): List<ChargeItem> =
        items.values.filter { chargeRepository.charges[it.chargeId]?.memberId == memberId }

    override fun findWithStatusByMember(memberId: Long): List<ChargeItemWithStatus> =
        findByMember(memberId).mapNotNull { item ->
            chargeRepository.charges[item.chargeId]?.let { charge ->
                ChargeItemWithStatus(
                    item = item,
                    chargeStatus = charge.status,
                    chargeType = charge.type,
                    paymentId =
                        paymentRepository.payments.values
                            .firstOrNull { it.chargeId == charge.chargeId && it.status == PaymentStatus.PAID }
                            ?.paymentId,
                )
            }
        }

    override fun existsPaidOrPending(
        memberId: Long,
        season: String,
        month: Int,
    ): Boolean =
        findWithStatusByMember(memberId).any {
            it.item.season == season && it.item.month == month && it.chargeStatus != ChargeStatus.CANCELLED
        }

    override fun save(item: ChargeItem): Long {
        val id = nextId++
        items[id] = item.copy(chargeItemId = id)
        return id
    }
}

class InMemoryPaymentRepository : PaymentRepository {
    val payments = mutableMapOf<Long, Payment>()
    val updates = mutableListOf<Payment>()
    private var nextId = 1L

    fun seed(payment: Payment): Payment {
        payments[payment.paymentId] = payment
        nextId = maxOf(nextId, payment.paymentId + 1)
        return payment
    }

    override fun findById(paymentId: Long): Payment? = payments[paymentId]

    override fun findByChargeId(chargeId: Long): List<Payment> = payments.values.filter { it.chargeId == chargeId }

    override fun findPaidBySponsorshipId(sponsorshipId: Long): Payment? = null

    override fun findByProviderRef(
        provider: String,
        providerRef: String,
    ): Payment? = payments.values.firstOrNull { it.provider == provider && it.providerRef == providerRef }

    override fun save(payment: Payment): Long {
        val id = nextId++
        payments[id] = payment.copy(paymentId = id)
        return id
    }

    override fun update(payment: Payment) {
        updates += payment
        payments[payment.paymentId] = payment
    }
}

class InMemoryEventRepository : EventRepository {
    val events = mutableMapOf<Long, Event>()
    val sectors = mutableMapOf<Long, EventSector>()
    private var nextEventId = 1L
    private var nextSectorId = 1L

    fun seed(event: Event): Event {
        events[event.eventId] = event
        nextEventId = maxOf(nextEventId, event.eventId + 1)
        return event
    }

    fun seedSector(sector: EventSector): EventSector {
        sectors[sector.sectorId] = sector
        nextSectorId = maxOf(nextSectorId, sector.sectorId + 1)
        return sector
    }

    override fun findById(id: Long): Event? = events[id]

    override fun findByFilter(filter: EventListFilter): List<Event> =
        when (filter) {
            EventListFilter.ALL -> events.values.toList()
            EventListFilter.CANCELLED -> events.values.filter { it.status == EventStatus.CANCELLED }
            else -> events.values.filter { it.status == EventStatus.SCHEDULED }
        }

    override fun save(event: Event): Long {
        val id = nextEventId++
        events[id] = event.copy(eventId = id)
        return id
    }

    override fun update(event: Event) {
        events[event.eventId] = event
    }

    override fun saveSector(sector: EventSector): Long {
        val id = nextSectorId++
        sectors[id] = sector.copy(sectorId = id)
        return id
    }

    override fun updateSector(sector: EventSector) {
        sectors[sector.sectorId] = sector
    }

    override fun deleteSector(sectorId: Long) {
        sectors.remove(sectorId)
    }

    override fun findSectorsByEvent(eventId: Long): List<EventSector> = sectors.values.filter { it.eventId == eventId }

    override fun findSectorById(sectorId: Long): EventSector? = sectors[sectorId]

    override fun reserveSeat(sectorId: Long): Boolean {
        val sector = sectors[sectorId] ?: return false
        if (sector.occupied >= sector.capacity) return false
        sectors[sectorId] = sector.copy(occupied = sector.occupied + 1)
        return true
    }

    override fun releaseSeat(sectorId: Long): Boolean {
        val sector = sectors[sectorId] ?: return false
        if (sector.occupied <= 0) return false
        sectors[sectorId] = sector.copy(occupied = sector.occupied - 1)
        return true
    }
}

class InMemoryTicketRepository : TicketRepository {
    val tickets = mutableMapOf<Long, Ticket>()
    private var nextId = 1L

    fun seed(ticket: Ticket): Ticket {
        tickets[ticket.ticketId] = ticket
        nextId = maxOf(nextId, ticket.ticketId + 1)
        return ticket
    }

    override fun findById(id: Long): Ticket? = tickets[id]

    override fun findByQrCode(qrCode: String): Ticket? = tickets.values.firstOrNull { it.qrCode == qrCode }

    override fun findByEventId(eventId: Long): List<Ticket> = tickets.values.filter { it.eventId == eventId }

    override fun findByChargeId(chargeId: Long): List<Ticket> = tickets.values.filter { it.chargeId == chargeId }

    override fun findByBuyerEmail(email: String): List<Ticket> = tickets.values.filter { it.buyerEmail == email }

    override fun findByMemberId(memberId: Long): List<Ticket> = tickets.values.filter { it.memberId == memberId }

    override fun existsActiveMemberTicket(
        eventId: Long,
        memberId: Long,
    ): Boolean =
        tickets.values.any {
            it.eventId == eventId && it.memberId == memberId && it.status != TicketStatus.CANCELLED
        }

    override fun save(ticket: Ticket): Long {
        val id = nextId++
        tickets[id] = ticket.copy(ticketId = id)
        return id
    }

    override fun confirm(
        ticketId: Long,
        qrCode: String,
    ): Boolean {
        val ticket = tickets[ticketId] ?: return false
        if (ticket.status != TicketStatus.RESERVED) return false
        tickets[ticketId] = ticket.copy(status = TicketStatus.CONFIRMED, qrCode = qrCode)
        return true
    }

    override fun cancel(ticketId: Long): Boolean {
        val ticket = tickets[ticketId] ?: return false
        if (ticket.status != TicketStatus.RESERVED && ticket.status != TicketStatus.CONFIRMED) return false
        tickets[ticketId] = ticket.copy(status = TicketStatus.CANCELLED)
        return true
    }

    override fun markAsUsed(
        ticketId: Long,
        usedAt: Instant,
    ): Boolean {
        val ticket = tickets[ticketId] ?: return false
        if (ticket.status != TicketStatus.CONFIRMED) return false
        tickets[ticketId] = ticket.copy(status = TicketStatus.USED, usedAt = usedAt)
        return true
    }
}

class InMemoryTeamCategoryRepository : TeamCategoryRepository {
    val categories = mutableMapOf<Long, TeamCategory>()

    fun seed(category: TeamCategory): TeamCategory {
        categories[category.teamId] = category
        return category
    }

    override fun findAll(): List<TeamCategory> = categories.values.toList()

    override fun findById(id: Long): TeamCategory? = categories[id]

    override fun findActive(): List<TeamCategory> = categories.values.filter { it.active }

    override fun save(team: TeamCategory): Long = unsupported()

    override fun update(team: TeamCategory): Unit = unsupported()

    override fun deactivate(id: Long): Unit = unsupported()

    override fun activate(id: Long): Unit = unsupported()
}

// ---- construtores de dados de exemplo partilhados ----

fun testAuth(
    role: Role,
    userId: Long,
    activeMemberId: Long? = null,
) = AuthenticatedUser(userId, "u$userId@example.test", "u$userId", role, activeMemberId, "token-$userId")

fun testUser(
    userId: Long,
    role: Role = Role.NORMAL,
    activeMemberId: Long? = null,
) = User(
    userId = userId,
    email = "u$userId@example.test",
    username = "u$userId",
    passwordValidation = PasswordValidationInfo("hash"),
    role = role,
    activeMemberId = activeMemberId,
)

fun testMember(
    memberId: Long,
    userId: Long? = null,
    memberNumber: Int = memberId.toInt(),
    category: MemberCategory = MemberCategory.SOCIO,
    status: MemberStatus = MemberStatus.ATIVO,
    membershipQuota: Int = 200,
    registrationDate: LocalDate = LocalDate.parse("2025-01-01"),
    approvalDate: LocalDate? = LocalDate.parse("2025-01-02"),
    birthDate: LocalDate = LocalDate.parse("2000-01-01"),
) = Member(
    memberId = memberId,
    userId = userId,
    memberNumber = memberNumber,
    completeName = "Member $memberId",
    birthDate = birthDate,
    birthplace = "Lisboa",
    email = "m$memberId@example.test",
    phone = "912345678",
    homePhone = null,
    address = "Rua Exemplo 1",
    postalCode = "1000-001",
    city = "Lisboa",
    nif = "${100000000 + memberId}",
    category = category,
    formerMember = false,
    status = status,
    membershipQuota = membershipQuota,
    billingLocation = null,
    registrationDate = registrationDate,
    approvalDate = approvalDate,
    privacyAccepted = true,
    comsAccepted = false,
)

fun testTeamCategory(teamId: Long = 1) =
    TeamCategory(
        teamId = teamId,
        teamGroupId = 1,
        code = "SENIORES",
        label = "Seniores",
        active = true,
        sortOrder = 1,
    )

fun testAthlete(
    athleteId: Long,
    memberId: Long,
    teamCategory: TeamCategory = testTeamCategory(),
    active: Boolean = true,
) = Athlete(
    athleteId = athleteId,
    memberId = memberId,
    nationality = "Portuguesa",
    niss = "${10000000000 + athleteId}",
    numeroUtente = "${300000000 + athleteId}",
    bi = "CC10000$athleteId",
    biExpirationDate = LocalDate.parse("2030-05-01"),
    school = null,
    schoolYear = null,
    schoolClass = null,
    lastClub = null,
    season = "2025/2026",
    teamCategory = teamCategory,
    active = active,
)
