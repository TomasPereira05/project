package pt.isel.jagoz.service

import kotlinx.datetime.LocalDate
import pt.isel.jagoz.domain.member.MemberCategory
import pt.isel.jagoz.domain.member.MemberDomain
import pt.isel.jagoz.domain.member.MemberError
import pt.isel.jagoz.domain.member.MemberStatus
import pt.isel.jagoz.domain.user.Role
import pt.isel.jagoz.domain.utils.ATHLETE_MEMBER_QUOTA
import pt.isel.jagoz.domain.utils.Either
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertIs
import kotlin.test.assertNull
import kotlin.test.assertTrue

class MemberServiceTests {
    private val txManager = FakeTransactionManager()
    private val tx = txManager.tx
    private val service = MemberService(txManager, MemberDomain())

    private val admin = testAuth(Role.ADMIN, userId = 1)
    private val secretaria = testAuth(Role.SECRETARIA, userId = 2)
    private val owner = testAuth(Role.NORMAL, userId = 5, activeMemberId = 20)
    private val stranger = testAuth(Role.NORMAL, userId = 6)

    // ---- createMember ----

    @Test
    fun `createMember saves a pending member without consuming a member number`() {
        val result = service.createMember(testMember(memberId = 0, memberNumber = 99, status = MemberStatus.PENDENTE), null, admin)

        assertIs<Either.Right<*>>(result)
        val saved =
            tx.memberRepository.members.values
                .single()
        assertEquals(0, saved.memberNumber)
        assertEquals(MemberStatus.PENDENTE, saved.status)
    }

    @Test
    fun `createMember links the account of the given username`() {
        tx.userRepository.seed(testUser(userId = 8))

        val result = service.createMember(testMember(memberId = 0, status = MemberStatus.PENDENTE), "u8", admin)

        assertIs<Either.Right<*>>(result)
        val saved =
            tx.memberRepository.members.values
                .single()
        assertEquals(8, saved.userId)
        assertEquals(
            saved.memberId,
            tx.userRepository.users
                .getValue(8)
                .activeMemberId,
        )
    }

    @Test
    fun `createMember fails when the linked username does not exist`() {
        val result = service.createMember(testMember(memberId = 0), "ghost", admin)

        assertIs<MemberError.NotFound>(assertIs<Either.Left<*>>(result).value)
        assertTrue(tx.memberRepository.members.isEmpty())
    }

    @Test
    fun `createMember rejects invalid member data before saving`() {
        val result = service.createMember(testMember(memberId = 0).copy(email = "bad"), null, admin)

        assertIs<MemberError.ValidationError>(assertIs<Either.Left<*>>(result).value)
        assertTrue(tx.memberRepository.members.isEmpty())
    }

    // ---- autorização por dono ----

    @Test
    fun `a normal user can only read their own member record`() {
        tx.memberRepository.seed(testMember(memberId = 20))
        tx.memberRepository.seed(testMember(memberId = 21))

        assertIs<Either.Right<*>>(service.getMemberById(20, owner))
        assertIs<MemberError.Forbidden>(assertIs<Either.Left<*>>(service.getMemberById(21, owner)).value)
        assertIs<MemberError.Forbidden>(assertIs<Either.Left<*>>(service.getMemberById(20, stranger)).value)
    }

    @Test
    fun `staff roles can read any member record`() {
        tx.memberRepository.seed(testMember(memberId = 20))

        assertIs<Either.Right<*>>(service.getMemberById(20, admin))
        assertIs<Either.Right<*>>(service.getMemberById(20, secretaria))
    }

    @Test
    fun `listing and management operations require backoffice roles`() {
        tx.memberRepository.seed(testMember(memberId = 20, status = MemberStatus.PENDENTE))

        assertIs<MemberError.Unauthorized>(assertIs<Either.Left<*>>(service.getAllActiveMembers(owner)).value)
        assertIs<MemberError.Unauthorized>(assertIs<Either.Left<*>>(service.getMembersPage(1, 10, authenticatedUser = owner)).value)
        assertIs<MemberError.Unauthorized>(assertIs<Either.Left<*>>(service.getMemberByEmail("m20@example.test", owner)).value)
        assertIs<MemberError.Unauthorized>(
            assertIs<Either.Left<*>>(service.approveMember(20, LocalDate.parse("2026-01-01"), owner)).value,
        )
        assertIs<MemberError.Unauthorized>(assertIs<Either.Left<*>>(service.rejectMember(20, owner)).value)
        assertIs<MemberError.Unauthorized>(assertIs<Either.Left<*>>(service.deactivateMember(20, owner)).value)
        assertIs<MemberError.Unauthorized>(
            assertIs<Either.Left<*>>(service.changeMemberCategory(20, MemberCategory.ATLETA_SOCIO, owner)).value,
        )
    }

    // ---- ciclo de vida ----

    @Test
    fun `approveMember assigns the next member number to first-time approvals only`() {
        tx.memberRepository.seed(testMember(memberId = 20, memberNumber = 0, status = MemberStatus.PENDENTE))
        tx.memberRepository.seed(testMember(memberId = 21, memberNumber = 42, status = MemberStatus.PENDENTE))

        service.approveMember(20, LocalDate.parse("2026-01-05"), admin)
        service.approveMember(21, LocalDate.parse("2026-01-05"), admin)

        assertTrue(
            tx.memberRepository.members
                .getValue(20)
                .memberNumber > 0,
        )
        assertEquals(
            42,
            tx.memberRepository.members
                .getValue(21)
                .memberNumber,
        )
        assertEquals(
            MemberStatus.ATIVO,
            tx.memberRepository.members
                .getValue(20)
                .status,
        )
    }

    @Test
    fun `approveMember propagates invalid transitions without writing`() {
        tx.memberRepository.seed(testMember(memberId = 20, status = MemberStatus.ATIVO))

        val result = service.approveMember(20, LocalDate.parse("2026-01-05"), admin)

        assertIs<MemberError.InvalidTransition>(assertIs<Either.Left<*>>(result).value)
        assertTrue(tx.memberRepository.updates.isEmpty())
    }

    @Test
    fun `member lifecycle reject deactivate and reactivate persist the transitions`() {
        tx.memberRepository.seed(testMember(memberId = 20, status = MemberStatus.PENDENTE))
        service.rejectMember(20, admin)
        assertEquals(
            MemberStatus.REJEITADO,
            tx.memberRepository.members
                .getValue(20)
                .status,
        )

        tx.memberRepository.seed(testMember(memberId = 21, status = MemberStatus.ATIVO))
        service.deactivateMember(21, admin)
        assertEquals(
            MemberStatus.INATIVO,
            tx.memberRepository.members
                .getValue(21)
                .status,
        )

        service.reactivateMember(21, LocalDate.parse("2026-02-01"), admin)
        assertEquals(
            MemberStatus.ATIVO,
            tx.memberRepository.members
                .getValue(21)
                .status,
        )
        assertEquals(
            LocalDate.parse("2026-02-01"),
            tx.memberRepository.members
                .getValue(21)
                .approvalDate,
        )
    }

    @Test
    fun `lifecycle operations fail for unknown members`() {
        assertIs<MemberError.NotFound>(assertIs<Either.Left<*>>(service.rejectMember(99, admin)).value)
        assertIs<MemberError.NotFound>(assertIs<Either.Left<*>>(service.getMemberById(99, admin)).value)
    }

    // ---- updates ----

    @Test
    fun `updateMemberContact persists valid data and rejects malformed data`() {
        tx.memberRepository.seed(testMember(memberId = 20))

        val ok =
            service.updateMemberContact(
                memberId = 20,
                email = "novo@example.test",
                phone = "911222333",
                address = "Rua Nova",
                postalCode = "2000-100",
                city = "Porto",
                authenticatedUser = admin,
            )
        assertIs<Either.Right<*>>(ok)
        assertEquals(
            "novo@example.test",
            tx.memberRepository.members
                .getValue(20)
                .email,
        )

        val bad =
            service.updateMemberContact(
                memberId = 20,
                email = "sem-arroba",
                phone = "911222333",
                address = "Rua Nova",
                postalCode = "2000-100",
                city = "Porto",
                authenticatedUser = admin,
            )
        assertIs<MemberError.ValidationError>(assertIs<Either.Left<*>>(bad).value)
    }

    @Test
    fun `a member can update their own record but not someone else's`() {
        tx.memberRepository.seed(testMember(memberId = 20))
        val candidate = testMember(memberId = 20).copy(completeName = "Novo Nome")

        assertIs<Either.Right<*>>(service.updateMember(20, candidate, owner))
        assertEquals(
            "Novo Nome",
            tx.memberRepository.members
                .getValue(20)
                .completeName,
        )

        tx.memberRepository.seed(testMember(memberId = 21))
        assertIs<MemberError.Forbidden>(
            assertIs<Either.Left<*>>(service.updateMember(21, candidate, owner)).value,
        )
    }

    @Test
    fun `changeMemberCategory to ATLETA_SOCIO applies the athlete quota`() {
        tx.memberRepository.seed(testMember(memberId = 20, category = MemberCategory.SOCIO, membershipQuota = 500))

        val result = service.changeMemberCategory(20, MemberCategory.ATLETA_SOCIO, admin)

        assertIs<Either.Right<*>>(result)
        val member = tx.memberRepository.members.getValue(20)
        assertEquals(MemberCategory.ATLETA_SOCIO, member.category)
        assertEquals(ATHLETE_MEMBER_QUOTA, member.membershipQuota)
    }

    // ---- paginação ----

    @Test
    fun `getMembersPage normalizes page and size and reports total pages`() {
        repeat(5) { tx.memberRepository.seed(testMember(memberId = (it + 1).toLong())) }

        val result = service.getMembersPage(page = 0, size = 2, authenticatedUser = admin)

        val page = assertIs<Either.Right<Page<*>>>(result).value
        assertEquals(1, page.page)
        assertEquals(2, page.size)
        assertEquals(5, page.total)
        assertEquals(3, page.totalPages)
        assertEquals(2, page.items.size)
    }

    @Test
    fun `getMembersPage never reports zero total pages`() {
        val result = service.getMembersPage(page = 1, size = 10, authenticatedUser = admin)

        val page = assertIs<Either.Right<Page<*>>>(result).value
        assertEquals(0, page.total)
        assertEquals(1, page.totalPages)
        assertNull(page.items.firstOrNull())
    }
}
