package pt.isel.jagoz.repository.jdbi

import kotlinx.datetime.Clock
import kotlinx.datetime.Instant
import kotlinx.datetime.LocalDate
import org.jdbi.v3.core.Handle
import org.jdbi.v3.core.Jdbi
import org.postgresql.ds.PGSimpleDataSource
import pt.isel.jagoz.domain.athlete.Athlete
import pt.isel.jagoz.domain.athlete.Guardian
import pt.isel.jagoz.domain.athlete.GuardianRole
import pt.isel.jagoz.domain.event.Event
import pt.isel.jagoz.domain.event.EventSector
import pt.isel.jagoz.domain.event.EventStatus
import pt.isel.jagoz.domain.event.Ticket
import pt.isel.jagoz.domain.event.TicketPriceType
import pt.isel.jagoz.domain.event.TicketStatus
import pt.isel.jagoz.domain.member.Member
import pt.isel.jagoz.domain.member.MemberCategory
import pt.isel.jagoz.domain.member.MemberStatus
import pt.isel.jagoz.domain.payment.Charge
import pt.isel.jagoz.domain.payment.ChargeItem
import pt.isel.jagoz.domain.payment.ChargeStatus
import pt.isel.jagoz.domain.payment.ChargeType
import pt.isel.jagoz.domain.payment.Payment
import pt.isel.jagoz.domain.payment.PaymentStatus
import pt.isel.jagoz.domain.user.PasswordValidationInfo
import pt.isel.jagoz.domain.user.Role
import pt.isel.jagoz.domain.user.Token
import pt.isel.jagoz.domain.user.TokenValidationInfo
import pt.isel.jagoz.domain.user.User
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertNotNull
import kotlin.test.assertNull
import kotlin.test.assertTrue

/**
 * Testes de integração contra o Postgres de testes (docker compose `db-tests`).
 * Cada teste corre dentro de uma transacção que é revertida no fim, por isso a
 * base (com o schema + dados de teste) fica intacta entre testes.
 */
class JdbiRepositoriesTests {
    private fun testWithHandleAndRollback(block: (Handle) -> Unit) =
        jdbi.useTransaction<Exception> { handle ->
            block(handle)
            handle.rollback()
        }

    private fun sampleMember(
        nif: String = "999888777",
        memberNumber: Int = 0,
        status: MemberStatus = MemberStatus.PENDENTE,
        category: MemberCategory = MemberCategory.SOCIO,
    ) = Member(
        memberId = 0,
        userId = null,
        memberNumber = memberNumber,
        completeName = "Teste JDBI",
        birthDate = LocalDate.parse("2000-01-01"),
        birthplace = "Lisboa",
        email = "jdbi@example.test",
        phone = "912345678",
        homePhone = null,
        address = "Rua JDBI 1",
        postalCode = "1000-001",
        city = "Lisboa",
        nif = nif,
        category = category,
        formerMember = false,
        status = status,
        membershipQuota = 200,
        billingLocation = null,
        registrationDate = LocalDate.parse("2026-01-01"),
        approvalDate = null,
        privacyAccepted = true,
        comsAccepted = false,
    )

    private fun insertAthlete(
        handle: Handle,
        member: Member = sampleMember(),
        niss: String = "99988877701",
        numeroUtente: String = "999888771",
        bi: String = "ZZ988771",
        active: Boolean = true,
        guardians: List<Guardian> = emptyList(),
    ): Athlete {
        val members = JdbiMemberRepository(handle)
        val athletes = JdbiAthleteRepository(handle)
        val teamCategory = JdbiTeamCategoryRepository(handle).findAll().first()
        val memberId = members.save(member)
        val athlete =
            Athlete(
                athleteId = 0,
                memberId = memberId,
                nationality = "Portuguesa",
                niss = niss,
                numeroUtente = numeroUtente,
                bi = bi,
                biExpirationDate = LocalDate.parse("2030-01-01"),
                school = null,
                schoolYear = null,
                schoolClass = null,
                lastClub = null,
                season = "2025/2026",
                teamCategory = teamCategory,
                active = active,
            )
        val athleteId = athletes.save(athlete)
        if (guardians.isNotEmpty()) athletes.saveGuardians(athleteId, guardians)
        return athlete.copy(athleteId = athleteId, guardians = guardians)
    }

    private fun father(email: String = "pai@example.test") =
        Guardian(
            guardianId = 0,
            athleteId = emptyList(),
            memberId = null,
            name = "Pai JDBI",
            role = GuardianRole.FATHER,
            kinship = null,
            email = email,
            phone = "911111111",
            professionalActivity = "Professor",
            contactPhone = null,
        )

    private fun insertEventWithSector(
        handle: Handle,
        capacity: Int = 2,
    ): Pair<Long, Long> {
        val events = JdbiEventRepository(handle)
        val eventId =
            events.save(
                Event(0, "Jogo JDBI", "desc", Clock.System.now(), "Estádio", 1000, 500, EventStatus.SCHEDULED),
            )
        val sectorId = events.saveSector(EventSector(0, eventId, "Bancada JDBI", capacity, 0))
        return eventId to sectorId
    }

    private fun insertTicket(
        handle: Handle,
        eventId: Long,
        sectorId: Long,
        status: TicketStatus = TicketStatus.RESERVED,
        qrCode: String? = null,
        memberId: Long? = null,
        priceType: TicketPriceType = TicketPriceType.NORMAL,
    ): Long {
        val ticketId =
            JdbiTicketRepository(handle).save(
                Ticket(
                    ticketId = 0,
                    eventId = eventId,
                    sectorId = sectorId,
                    chargeId = null,
                    memberId = memberId,
                    priceType = priceType,
                    price = 1000,
                    buyerEmail = "buyer@example.test",
                    buyerName = "Buyer",
                    status = TicketStatus.RESERVED,
                ),
            )
        if (status == TicketStatus.CONFIRMED || status == TicketStatus.USED) {
            JdbiTicketRepository(handle).confirm(ticketId, qrCode ?: "tok-$ticketId")
        }
        if (status == TicketStatus.USED) {
            JdbiTicketRepository(handle).markAsUsed(ticketId, Clock.System.now())
        }
        return ticketId
    }

    // ---- member ----

    @Test
    fun `member roundtrip preserves all persisted fields`() {
        testWithHandleAndRollback { handle ->
            val members = JdbiMemberRepository(handle)
            val memberId = members.save(sampleMember())

            val loaded = members.findById(memberId)

            assertNotNull(loaded)
            // inclui userId=null: o MemberMapper tem de devolver null (não 0) quando
            // user_id é NULL, como fazem os restantes mappers
            assertEquals(sampleMember().copy(memberId = memberId), loaded)
        }
    }

    @Test
    fun `two pending members without a number can coexist`() {
        testWithHandleAndRollback { handle ->
            val members = JdbiMemberRepository(handle)
            val first = members.save(sampleMember(nif = "999888777"))
            val second = members.save(sampleMember(nif = "999888778"))

            // sem número atribuído a coluna fica NULL, por isso não colide no UNIQUE(member_number)
            assertEquals(0, members.findById(first)?.memberNumber)
            assertEquals(0, members.findById(second)?.memberNumber)
        }
    }

    @Test
    fun `existsByNif and findByMemberNumber locate the member`() {
        testWithHandleAndRollback { handle ->
            val members = JdbiMemberRepository(handle)
            members.save(sampleMember(nif = "999888777", memberNumber = 987654))

            assertTrue(members.existsByNif("999888777"))
            assertFalse(members.existsByNif("999888700"))
            assertEquals("999888777", members.findByMemberNumber(987654)?.nif)
        }
    }

    @Test
    fun `nextMemberNumber is one above the highest assigned number`() {
        testWithHandleAndRollback { handle ->
            val members = JdbiMemberRepository(handle)
            members.save(sampleMember(memberNumber = 987654))

            assertEquals(987655, members.nextMemberNumber())
        }
    }

    @Test
    fun `member update persists the new state`() {
        testWithHandleAndRollback { handle ->
            val members = JdbiMemberRepository(handle)
            val memberId = members.save(sampleMember())
            val saved = members.findById(memberId)!!

            members.update(saved.copy(status = MemberStatus.ATIVO, memberNumber = 987654, membershipQuota = 300))

            val updated = members.findById(memberId)!!
            assertEquals(MemberStatus.ATIVO, updated.status)
            assertEquals(987654, updated.memberNumber)
            assertEquals(300, updated.membershipQuota)
        }
    }

    @Test
    fun `member search filters by name category and status`() {
        testWithHandleAndRollback { handle ->
            val members = JdbiMemberRepository(handle)
            members.save(sampleMember(nif = "999888777").copy(completeName = "Zacarias Filtro"))

            val byName = members.findPageFiltered(10, 0, "zacarias f", null, null)
            assertEquals(1, byName.size)
            assertEquals(0, members.findPageFiltered(10, 0, "zacarias f", null, MemberStatus.ATIVO).size)
            assertEquals(1, members.countFiltered("zacarias f", MemberCategory.SOCIO, MemberStatus.PENDENTE))
        }
    }

    // ---- athlete + guardians ----

    @Test
    fun `athlete roundtrip loads detail with guardians`() {
        testWithHandleAndRollback { handle ->
            val athlete = insertAthlete(handle, guardians = listOf(father()))

            val detail = JdbiAthleteRepository(handle).findByIdWithDetail(athlete.athleteId)

            assertNotNull(detail)
            assertEquals(athlete.niss, detail.niss)
            assertEquals("Pai JDBI", detail.guardians.single().name)
        }
    }

    @Test
    fun `findDuplicateUniqueField names the first conflicting field`() {
        testWithHandleAndRollback { handle ->
            insertAthlete(handle)
            val athletes = JdbiAthleteRepository(handle)

            assertEquals("niss", athletes.findDuplicateUniqueField("99988877701", "000000000", "XX000000"))
            assertEquals("numeroUtente", athletes.findDuplicateUniqueField("00000000000", "999888771", "XX000000"))
            assertEquals("bi", athletes.findDuplicateUniqueField("00000000000", "000000000", "ZZ988771"))
            assertNull(athletes.findDuplicateUniqueField("00000000000", "000000000", "XX000000"))
        }
    }

    @Test
    fun `the same guardian email is reused across siblings instead of duplicated`() {
        testWithHandleAndRollback { handle ->
            val athletes = JdbiAthleteRepository(handle)
            val first = insertAthlete(handle, guardians = listOf(father()))
            val second =
                insertAthlete(
                    handle,
                    member = sampleMember(nif = "999888778"),
                    niss = "99988877702",
                    numeroUtente = "999888772",
                    bi = "ZZ988772",
                    guardians = listOf(father()),
                )

            val guardianIds =
                listOf(first, second).map {
                    athletes
                        .findByIdWithDetail(it.athleteId)!!
                        .guardians
                        .single()
                        .guardianId
                }
            assertEquals(guardianIds[0], guardianIds[1])

            // desligar um irmão não pode apagar o guardian partilhado
            athletes.deleteGuardiansByAthleteId(first.athleteId)
            assertEquals(
                1,
                athletes.findByIdWithDetail(second.athleteId)!!.guardians.size,
            )
        }
    }

    @Test
    fun `athlete admin listing puts pending members first`() {
        testWithHandleAndRollback { handle ->
            val athletes = JdbiAthleteRepository(handle)
            val members = JdbiMemberRepository(handle)
            val active = insertAthlete(handle)
            members.update(members.findById(active.memberId)!!.copy(status = MemberStatus.ATIVO, memberNumber = 987001))
            val pending =
                insertAthlete(
                    handle,
                    member = sampleMember(nif = "999888778", status = MemberStatus.PENDENTE),
                    niss = "99988877702",
                    numeroUtente = "999888772",
                    bi = "ZZ988772",
                )

            val page = athletes.findPage(1000, 0)

            val pendingIndex = page.indexOfFirst { it.athleteId == pending.athleteId }
            val activeIndex = page.indexOfFirst { it.athleteId == active.athleteId }
            assertTrue(pendingIndex in 0 until activeIndex, "pendentes têm de vir antes dos restantes")
        }
    }

    @Test
    fun `linkUserToAthlete is idempotent and authorizes the managing guardian`() {
        testWithHandleAndRollback { handle ->
            val athletes = JdbiAthleteRepository(handle)
            val users = JdbiUserRepository(handle)
            val athlete = insertAthlete(handle)
            val userId =
                users.save(
                    User(0, "gestor@example.test", "gestor-jdbi", PasswordValidationInfo("hash"), Role.NORMAL),
                )

            athletes.linkUserToAthlete(userId, athlete.athleteId)
            athletes.linkUserToAthlete(userId, athlete.athleteId)

            assertEquals(listOf(athlete.athleteId), athletes.findByManagingUser(userId).map { it.athleteId })
            assertTrue(athletes.isUserManagingMember(userId, athlete.memberId))
            assertFalse(athletes.isUserManagingMember(userId, athlete.memberId + 1000))
        }
    }

    // ---- charge / payment ----

    @Test
    fun `charge with items reports the charge status per fee`() {
        testWithHandleAndRollback { handle ->
            val members = JdbiMemberRepository(handle)
            val charges = JdbiChargeRepository(handle)
            val items = JdbiChargeItemRepository(handle)
            val memberId = members.save(sampleMember(status = MemberStatus.ATIVO))

            val chargeId =
                charges.save(
                    Charge(
                        chargeId = 0,
                        type = ChargeType.MEMBER_FEE,
                        memberId = memberId,
                        value = 400,
                        status = ChargeStatus.PENDING,
                        season = "2025/2026",
                        month = null,
                        createdAt = LocalDate.parse("2026-05-01"),
                        creationUser = null,
                    ),
                )
            items.save(ChargeItem(0, chargeId, "2025/2026", 5, 200, "Quota Maio 2025/2026"))
            items.save(ChargeItem(0, chargeId, "2025/2026", 6, 200, "Quota Junho 2025/2026"))

            val withStatus = items.findWithStatusByMember(memberId)
            assertEquals(2, withStatus.size)
            assertTrue(withStatus.all { it.chargeStatus == ChargeStatus.PENDING && it.paymentId == null })

            charges.update(charges.findById(chargeId)!!.copy(status = ChargeStatus.PAID, paidAt = LocalDate.parse("2026-05-02")))
            assertTrue(items.findWithStatusByMember(memberId).all { it.chargeStatus == ChargeStatus.PAID })
        }
    }

    @Test
    fun `payment is found by provider reference and survives a status update`() {
        testWithHandleAndRollback { handle ->
            val members = JdbiMemberRepository(handle)
            val charges = JdbiChargeRepository(handle)
            val payments = JdbiPaymentRepository(handle)
            val memberId = members.save(sampleMember(status = MemberStatus.ATIVO))
            val chargeId =
                charges.save(
                    Charge(
                        0,
                        ChargeType.MEMBER_FEE,
                        memberId,
                        null,
                        200,
                        ChargeStatus.PENDING,
                        "2025/2026",
                        5,
                        LocalDate.parse("2026-05-01"),
                        null,
                    ),
                )

            val createdAt = Instant.parse("2026-05-01T10:00:00Z")
            payments.save(Payment(0, chargeId, 200, "STRIPE", "cs_jdbi_1", PaymentStatus.PENDING, createdAt))

            val found = payments.findByProviderRef("STRIPE", "cs_jdbi_1")
            assertNotNull(found)
            assertEquals(PaymentStatus.PENDING, found.status)
            assertNull(payments.findByProviderRef("STRIPE", "cs_other"))

            val confirmedAt = Instant.parse("2026-05-01T11:00:00Z")
            payments.update(found.copy(status = PaymentStatus.PAID, confirmedAt = confirmedAt))
            val updated = payments.findByProviderRef("STRIPE", "cs_jdbi_1")!!
            assertEquals(PaymentStatus.PAID, updated.status)
            assertEquals(confirmedAt, updated.confirmedAt)
        }
    }

    // ---- event / ticket ----

    @Test
    fun `reserveSeat stops atomically at the sector capacity`() {
        testWithHandleAndRollback { handle ->
            val events = JdbiEventRepository(handle)
            val (_, sectorId) = insertEventWithSector(handle, capacity = 2)

            assertTrue(events.reserveSeat(sectorId))
            assertTrue(events.reserveSeat(sectorId))
            assertFalse(events.reserveSeat(sectorId))
            assertEquals(2, events.findSectorById(sectorId)?.occupied)
        }
    }

    @Test
    fun `releaseSeat never drops below zero`() {
        testWithHandleAndRollback { handle ->
            val events = JdbiEventRepository(handle)
            val (_, sectorId) = insertEventWithSector(handle, capacity = 2)
            events.reserveSeat(sectorId)

            assertTrue(events.releaseSeat(sectorId))
            assertFalse(events.releaseSeat(sectorId))
            assertEquals(0, events.findSectorById(sectorId)?.occupied)
        }
    }

    @Test
    fun `a ticket is confirmed only once and only from reserved`() {
        testWithHandleAndRollback { handle ->
            val tickets = JdbiTicketRepository(handle)
            val (eventId, sectorId) = insertEventWithSector(handle)
            val ticketId = insertTicket(handle, eventId, sectorId)

            assertTrue(tickets.confirm(ticketId, "tok-jdbi-1"))
            assertFalse(tickets.confirm(ticketId, "tok-jdbi-2"))
            assertEquals("tok-jdbi-1", tickets.findById(ticketId)?.qrCode)
            assertEquals(TicketStatus.CONFIRMED, tickets.findById(ticketId)?.status)
        }
    }

    @Test
    fun `the same qr code cannot be consumed twice at the gate`() {
        testWithHandleAndRollback { handle ->
            val tickets = JdbiTicketRepository(handle)
            val (eventId, sectorId) = insertEventWithSector(handle)
            val ticketId = insertTicket(handle, eventId, sectorId, status = TicketStatus.CONFIRMED, qrCode = "tok-gate")

            assertTrue(tickets.markAsUsed(ticketId, Clock.System.now()))
            assertFalse(tickets.markAsUsed(ticketId, Clock.System.now()))
            assertEquals(TicketStatus.USED, tickets.findByQrCode("tok-gate")?.status)
            assertNotNull(tickets.findByQrCode("tok-gate")?.usedAt)
        }
    }

    @Test
    fun `cancel only transitions reserved or confirmed tickets`() {
        testWithHandleAndRollback { handle ->
            val tickets = JdbiTicketRepository(handle)
            val (eventId, sectorId) = insertEventWithSector(handle)
            val used = insertTicket(handle, eventId, sectorId, status = TicketStatus.USED, qrCode = "tok-used")
            val reserved = insertTicket(handle, eventId, sectorId)

            assertFalse(tickets.cancel(used))
            assertTrue(tickets.cancel(reserved))
            assertFalse(tickets.cancel(reserved))
        }
    }

    @Test
    fun `existsActiveMemberTicket ignores cancelled member tickets`() {
        testWithHandleAndRollback { handle ->
            val tickets = JdbiTicketRepository(handle)
            val members = JdbiMemberRepository(handle)
            val (eventId, sectorId) = insertEventWithSector(handle)
            val memberId = members.save(sampleMember(status = MemberStatus.ATIVO))
            val ticketId = insertTicket(handle, eventId, sectorId, memberId = memberId, priceType = TicketPriceType.MEMBER)

            assertTrue(tickets.existsActiveMemberTicket(eventId, memberId))
            tickets.cancel(ticketId)
            assertFalse(tickets.existsActiveMemberTicket(eventId, memberId))
        }
    }

    // ---- users / tokens ----

    @Test
    fun `token roundtrip finds the owner and can be revoked`() {
        testWithHandleAndRollback { handle ->
            val users = JdbiUserRepository(handle)
            val userId =
                users.save(
                    User(0, "token@example.test", "token-jdbi", PasswordValidationInfo("hash"), Role.NORMAL),
                )
            val validation = TokenValidationInfo("validation-jdbi")
            val now = Clock.System.now()
            users.createToken(Token(validation, userId, createdAt = now, lastUsedAt = now))

            val pair = users.getTokenByValidation(validation)
            assertNotNull(pair)
            assertEquals(userId, pair.first.userId)

            assertEquals(1, users.removeTokenByValidation(validation))
            assertNull(users.getTokenByValidation(validation))
        }
    }

    private companion object {
        private val jdbi: Jdbi =
            Jdbi
                .create(
                    PGSimpleDataSource().apply {
                        setURL(requireNotNull(System.getenv("DB_URL")) { "DB_URL environment variable is required" })
                    },
                ).configureWithAppRequirements()
    }
}
