package pt.isel.jagoz.service

import kotlinx.datetime.LocalDate
import pt.isel.jagoz.domain.athlete.Athlete
import pt.isel.jagoz.domain.athlete.AthleteDomain
import pt.isel.jagoz.domain.athlete.AthleteError
import pt.isel.jagoz.domain.athlete.GuardianRole
import pt.isel.jagoz.domain.member.MemberCategory
import pt.isel.jagoz.domain.member.MemberDomain
import pt.isel.jagoz.domain.member.MemberStatus
import pt.isel.jagoz.domain.utils.ATHLETE_MEMBER_QUOTA
import pt.isel.jagoz.domain.utils.Either
import kotlin.test.Test
import kotlin.test.assertContains
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertIs
import kotlin.test.assertTrue

class AthleteServiceTests {
    private val txManager = FakeTransactionManager()
    private val tx = txManager.tx
    private val service = AthleteService(txManager, AthleteDomain(), MemberDomain())

    init {
        tx.teamCategoryRepository.seed(testTeamCategory(teamId = 1))
    }

    private fun registrationInput(
        userId: Long? = null,
        creatorUserId: Long? = null,
        email: String = "lara@example.test",
        nif: String = "123456789",
        niss: String = "11122233301",
        numeroUtente: String = "300003001",
        bi: String = "CC300010",
        birthplace: String? = "Mafra",
        biExpirationDate: LocalDate = LocalDate.parse("2031-01-01"),
        teamCategoryId: Long = 1,
        guardians: List<GuardianInput> = listOf(fatherInput()),
    ) = AthleteRegistrationInput(
        userId = userId,
        creatorUserId = creatorUserId,
        completeName = "Lara Nunes",
        birthDate = LocalDate.parse("2009-10-21"),
        birthplace = birthplace,
        email = email,
        phone = "912345678",
        homePhone = null,
        address = "Rua Exemplo 1",
        postalCode = "2640-001",
        city = "Mafra",
        nif = nif,
        privacyAccepted = true,
        comsAccepted = false,
        registrationDate = LocalDate.parse("2026-05-01"),
        nationality = "Portuguesa",
        niss = niss,
        numeroUtente = numeroUtente,
        bi = bi,
        biExpirationDate = biExpirationDate,
        school = "Escola",
        schoolYear = "10",
        schoolClass = "A",
        lastClub = null,
        season = "2025/2026",
        teamCategoryId = teamCategoryId,
        hasFamilyInClub = false,
        schoolCertificationAccepted = true,
        guardians = guardians,
    )

    private fun fatherInput(memberNumber: Int? = null) =
        GuardianInput(
            name = "Nuno Nunes",
            role = GuardianRole.FATHER,
            kinship = null,
            email = "nuno@example.test",
            phone = "911111111",
            professionalActivity = "Professor",
            contactPhone = null,
            memberNumber = memberNumber,
        )

    // ---- registerAthlete ----

    private fun assertRight(result: AthleteResult): Athlete {
        assertIs<Either.Right<Athlete>>(result)
        return result.value
    }

    @Test
    fun `registerAthlete creates ATLETA_SOCIO member and athlete and guardians in one transaction`() {
        val result = service.registerAthlete(registrationInput())

        val athlete = assertRight(result)
        val member =
            tx.memberRepository.members.values
                .single()
        assertEquals(MemberCategory.ATLETA_SOCIO, member.category)
        assertEquals(MemberStatus.PENDENTE, member.status)
        assertEquals(ATHLETE_MEMBER_QUOTA, member.membershipQuota)
        assertEquals(0, member.memberNumber)
        assertEquals(member.memberId, athlete.memberId)
        assertTrue(athlete.active)
        assertEquals(
            1,
            tx.athleteRepository.guardiansByAthlete
                .getValue(athlete.athleteId)
                .size,
        )
        assertEquals(1, txManager.runs)
    }

    @Test
    fun `registerAthlete fails when team category does not exist and writes nothing`() {
        val result = service.registerAthlete(registrationInput(teamCategoryId = 99))

        assertIs<AthleteError.TeamCategoryNotFound>(assertIs<Either.Left<*>>(result).value)
        assertNoWrites()
    }

    @Test
    fun `registerAthlete fails on blank birthplace before any write`() {
        val result = service.registerAthlete(registrationInput(birthplace = " "))

        assertIs<AthleteError.ValidationError>(assertIs<Either.Left<*>>(result).value)
        assertNoWrites()
    }

    @Test
    fun `registerAthlete fails when biExpirationDate is not after registration date`() {
        val result = service.registerAthlete(registrationInput(biExpirationDate = LocalDate.parse("2026-05-01")))

        assertIs<AthleteError.InvalidDateField>(assertIs<Either.Left<*>>(result).value)
        assertNoWrites()
    }

    @Test
    fun `registerAthlete fails when guardian member number does not exist`() {
        val result = service.registerAthlete(registrationInput(guardians = listOf(fatherInput(memberNumber = 555))))

        val error = assertIs<AthleteError.GuardianMemberNotFound>(assertIs<Either.Left<*>>(result).value)
        assertEquals(555, error.memberNumber)
        assertNoWrites()
    }

    @Test
    fun `registerAthlete fails on invalid member email before any write`() {
        val result = service.registerAthlete(registrationInput(email = "not-an-email"))

        assertIs<AthleteError.ValidationError>(assertIs<Either.Left<*>>(result).value)
        assertNoWrites()
    }

    @Test
    fun `registerAthlete fails on malformed niss before any write`() {
        val result = service.registerAthlete(registrationInput(niss = "123"))

        assertIs<AthleteError.ValidationError>(assertIs<Either.Left<*>>(result).value)
        assertNoWrites()
    }

    @Test
    fun `registerAthlete rejects duplicate nif without creating athlete`() {
        tx.memberRepository.seed(testMember(memberId = 50).copy(nif = "123456789"))

        val result = service.registerAthlete(registrationInput(nif = "123456789"))

        val error = assertIs<AthleteError.AlreadyExists>(assertIs<Either.Left<*>>(result).value)
        assertEquals("nif", error.field)
        assertTrue(tx.athleteRepository.athletes.isEmpty())
        assertEquals(1, tx.memberRepository.members.size)
    }

    @Test
    fun `registerAthlete rejects duplicate athlete unique fields without creating member`() {
        tx.memberRepository.seed(testMember(memberId = 50))
        tx.athleteRepository.seed(testAthlete(athleteId = 5, memberId = 50).copy(niss = "11122233301"))

        val result = service.registerAthlete(registrationInput(niss = "11122233301"))

        val error = assertIs<AthleteError.AlreadyExists>(assertIs<Either.Left<*>>(result).value)
        assertEquals("niss", error.field)
        assertEquals(1, tx.memberRepository.members.size)
        assertEquals(1, tx.athleteRepository.athletes.size)
    }

    @Test
    fun `self registration links user account to the new member`() {
        tx.userRepository.seed(testUser(userId = 7))

        val result = service.registerAthlete(registrationInput(userId = 7))

        assertIs<Either.Right<*>>(result)
        val memberId =
            tx.memberRepository.members.values
                .single()
                .memberId
        assertEquals(
            memberId,
            tx.userRepository.users
                .getValue(7)
                .activeMemberId,
        )
    }

    @Test
    fun `registerAthlete fails when self registration user does not exist and writes nothing`() {
        val result = service.registerAthlete(registrationInput(userId = 7))

        assertIs<AthleteError.NotFound>(assertIs<Either.Left<*>>(result).value)
        assertNoWrites()
    }

    @Test
    fun `registration by a guardian links the athlete to the creator account`() {
        val result = service.registerAthlete(registrationInput(creatorUserId = 9))

        val athlete = assertRight(result)
        assertContains(tx.athleteRepository.userAthleteLinks, 9L to athlete.athleteId)
    }

    @Test
    fun `guardian with member number is linked to the existing member`() {
        tx.memberRepository.seed(testMember(memberId = 60, memberNumber = 1001))

        val result = service.registerAthlete(registrationInput(guardians = listOf(fatherInput(memberNumber = 1001))))

        val athlete = assertRight(result)
        val guardian =
            tx.athleteRepository.guardiansByAthlete
                .getValue(athlete.athleteId)
                .single()
        assertEquals(60L, guardian.memberId)
    }

    private fun assertNoWrites() {
        assertTrue(tx.memberRepository.members.isEmpty())
        assertTrue(tx.athleteRepository.athletes.isEmpty())
        assertTrue(tx.athleteRepository.guardiansByAthlete.isEmpty())
    }

    // ---- approveAthlete / rejectAthlete ----

    @Test
    fun `approveAthlete activates pending member assigning number and keeping the athlete quota`() {
        tx.memberRepository.seed(
            testMember(
                memberId = 10,
                memberNumber = 0,
                category = MemberCategory.ATLETA_SOCIO,
                status = MemberStatus.PENDENTE,
                membershipQuota = ATHLETE_MEMBER_QUOTA,
            ),
        )
        tx.athleteRepository.seed(testAthlete(athleteId = 3, memberId = 10, active = false))

        val result = service.approveAthlete(3, LocalDate.parse("2026-06-01"))

        assertIs<Either.Right<*>>(result)
        val member = tx.memberRepository.members.getValue(10)
        assertEquals(MemberStatus.ATIVO, member.status)
        assertTrue(member.memberNumber > 0)
        assertEquals(ATHLETE_MEMBER_QUOTA, member.membershipQuota)
        assertEquals(LocalDate.parse("2026-06-01"), member.approvalDate)
        assertTrue(
            tx.athleteRepository.athletes
                .getValue(3)
                .active,
        )
    }

    @Test
    fun `approveAthlete keeps an existing member number`() {
        tx.memberRepository.seed(
            testMember(memberId = 10, memberNumber = 77, category = MemberCategory.ATLETA_SOCIO, status = MemberStatus.PENDENTE),
        )
        tx.athleteRepository.seed(testAthlete(athleteId = 3, memberId = 10))

        service.approveAthlete(3, LocalDate.parse("2026-06-01"))

        assertEquals(
            77,
            tx.memberRepository.members
                .getValue(10)
                .memberNumber,
        )
    }

    @Test
    fun `approveAthlete rejects member that is not pending`() {
        tx.memberRepository.seed(testMember(memberId = 10, category = MemberCategory.ATLETA_SOCIO, status = MemberStatus.ATIVO))
        tx.athleteRepository.seed(testAthlete(athleteId = 3, memberId = 10))

        val result = service.approveAthlete(3, LocalDate.parse("2026-06-01"))

        assertIs<Either.Left<*>>(result)
    }

    @Test
    fun `approveAthlete fails for unknown athlete`() {
        val result = service.approveAthlete(99, LocalDate.parse("2026-06-01"))

        assertIs<AthleteError.NotFound>(assertIs<Either.Left<*>>(result).value)
    }

    @Test
    fun `rejectAthlete marks member rejected and deactivates athlete`() {
        tx.memberRepository.seed(testMember(memberId = 10, category = MemberCategory.ATLETA_SOCIO, status = MemberStatus.PENDENTE))
        tx.athleteRepository.seed(testAthlete(athleteId = 3, memberId = 10, active = true))

        val result = service.rejectAthlete(3)

        assertIs<Either.Right<*>>(result)
        assertEquals(
            MemberStatus.REJEITADO,
            tx.memberRepository.members
                .getValue(10)
                .status,
        )
        assertFalse(
            tx.athleteRepository.athletes
                .getValue(3)
                .active,
        )
    }

    // ---- changeTeamCategory / markInactive / reactivate ----

    @Test
    fun `changeTeamCategory moves athlete to the new category`() {
        val juniores = tx.teamCategoryRepository.seed(testTeamCategory(teamId = 2).copy(code = "JUNIORES", label = "Juniores"))
        tx.athleteRepository.seed(testAthlete(athleteId = 3, memberId = 10))

        val result = service.changeTeamCategory(3, 2)

        assertIs<Either.Right<*>>(result)
        assertEquals(
            juniores,
            tx.athleteRepository.athletes
                .getValue(3)
                .teamCategory,
        )
    }

    @Test
    fun `changeTeamCategory rejects unknown category and same category`() {
        tx.athleteRepository.seed(testAthlete(athleteId = 3, memberId = 10))

        assertIs<AthleteError.TeamCategoryNotFound>(assertIs<Either.Left<*>>(service.changeTeamCategory(3, 99)).value)
        assertIs<AthleteError.DomainError>(assertIs<Either.Left<*>>(service.changeTeamCategory(3, 1)).value)
    }

    @Test
    fun `markInactive and reactivate flip the active flag with guarded transitions`() {
        tx.athleteRepository.seed(testAthlete(athleteId = 3, memberId = 10, active = true))

        assertIs<Either.Right<*>>(service.markInactive(3))
        assertFalse(
            tx.athleteRepository.athletes
                .getValue(3)
                .active,
        )
        assertIs<AthleteError.InvalidStateTransition>(assertIs<Either.Left<*>>(service.markInactive(3)).value)

        assertIs<Either.Right<*>>(service.reactivate(3))
        assertTrue(
            tx.athleteRepository.athletes
                .getValue(3)
                .active,
        )
        assertIs<AthleteError.InvalidStateTransition>(assertIs<Either.Left<*>>(service.reactivate(3)).value)
    }

    // ---- updateAthlete ----

    private fun updateInput(
        niss: String = "11122233399",
        guardians: List<GuardianInput>? = null,
    ) = AthleteUpdateInput(
        completeName = "Lara Nunes Silva",
        birthDate = LocalDate.parse("2009-10-21"),
        birthplace = "Mafra",
        email = "lara.nova@example.test",
        phone = "912345000",
        homePhone = null,
        address = "Rua Nova 2",
        postalCode = "2640-002",
        city = "Mafra",
        nif = "123456789",
        membershipQuota = 2500,
        nationality = "Portuguesa",
        niss = niss,
        numeroUtente = "300003009",
        bi = "CC300099",
        biExpirationDate = LocalDate.parse("2032-01-01"),
        jerseyNumber = 8,
        position = "Defesa",
        school = null,
        schoolYear = null,
        schoolClass = null,
        lastClub = null,
        season = "2026/2027",
        hasFamilyInClub = true,
        guardians = guardians,
    )

    @Test
    fun `updateAthlete persists member and athlete fields in one transaction`() {
        tx.memberRepository.seed(testMember(memberId = 10, category = MemberCategory.ATLETA_SOCIO))
        tx.athleteRepository.seed(testAthlete(athleteId = 3, memberId = 10))

        val result = service.updateAthlete(3, updateInput())

        assertIs<Either.Right<*>>(result)
        val member = tx.memberRepository.members.getValue(10)
        assertEquals("Lara Nunes Silva", member.completeName)
        val athlete = tx.athleteRepository.athletes.getValue(3)
        assertEquals("11122233399", athlete.niss)
        assertEquals(8, athlete.jerseyNumber)
        assertEquals(1, txManager.runs)
    }

    @Test
    fun `updateAthlete lets the admin set the athlete monthly quota`() {
        tx.memberRepository.seed(testMember(memberId = 10, category = MemberCategory.ATLETA_SOCIO))
        tx.athleteRepository.seed(testAthlete(athleteId = 3, memberId = 10))

        service.updateAthlete(3, updateInput())

        // A quota do atleta é editável pelo admin na ficha: o valor introduzido tem de
        // ser persistido tal e qual (o default de 20€ só se aplica na inscrição).
        assertEquals(
            2500,
            tx.memberRepository.members
                .getValue(10)
                .membershipQuota,
        )
    }

    @Test
    fun `updateAthlete replaces guardians only when a new set is provided`() {
        tx.memberRepository.seed(testMember(memberId = 10, category = MemberCategory.ATLETA_SOCIO))
        tx.athleteRepository.seed(testAthlete(athleteId = 3, memberId = 10))
        tx.athleteRepository.saveGuardians(3, emptyList())

        service.updateAthlete(3, updateInput(guardians = listOf(fatherInput())))
        assertEquals(
            "Nuno Nunes",
            tx.athleteRepository.guardiansByAthlete
                .getValue(3)
                .single()
                .name,
        )

        service.updateAthlete(3, updateInput(guardians = null))
        assertEquals(
            1,
            tx.athleteRepository.guardiansByAthlete
                .getValue(3)
                .size,
        )
    }

    @Test
    fun `updateAthlete with invalid athlete data must not persist the member changes`() {
        val original = tx.memberRepository.seed(testMember(memberId = 10, category = MemberCategory.ATLETA_SOCIO))
        tx.athleteRepository.seed(testAthlete(athleteId = 3, memberId = 10))

        val result = service.updateAthlete(3, updateInput(niss = "bad"))

        assertIs<AthleteError.ValidationError>(assertIs<Either.Left<*>>(result).value)
        // Either.Left não faz rollback da transacção, por isso nenhuma escrita pode
        // preceder uma validação que ainda pode falhar.
        assertEquals(original, tx.memberRepository.members.getValue(10))
    }
}
