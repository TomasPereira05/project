package pt.isel.jagoz.member

import kotlinx.datetime.LocalDate
import pt.isel.jagoz.domain.member.Member
import pt.isel.jagoz.domain.member.MemberCategory
import pt.isel.jagoz.domain.member.MemberDomain
import pt.isel.jagoz.domain.member.MemberError
import pt.isel.jagoz.domain.member.MemberStatus
import pt.isel.jagoz.domain.utils.ATHLETE_MEMBER_QUOTA
import pt.isel.jagoz.domain.utils.Either
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertIs
import kotlin.test.assertNotEquals
import kotlin.test.assertNotNull
import kotlin.test.assertTrue
import kotlin.test.fail

class MemberDomainTests {
    private val domain = MemberDomain()

    private fun sampleMember(
        status: MemberStatus = MemberStatus.PENDENTE,
        category: MemberCategory = MemberCategory.SOCIO,
        membershipQuota: Int = 200,
        registrationDate: LocalDate = LocalDate.parse("2025-01-01"),
    ) = Member(
        memberId = 1,
        userId = null,
        memberNumber = 42,
        completeName = "Jose Manel",
        birthDate = LocalDate.parse("2000-01-01"),
        birthplace = "Lisboa",
        email = "joseManel@example.com",
        phone = "912345678",
        homePhone = null,
        address = "Rua Exemplo 1",
        postalCode = "1000-001",
        city = "Lisboa",
        nif = "123456789",
        category = category,
        formerMember = false,
        status = status,
        membershipQuota = membershipQuota,
        billingLocation = null,
        registrationDate = registrationDate,
        approvalDate = null,
        privacyAccepted = true,
        comsAccepted = false,
    )

    // ---- approve ----

    @Test
    fun `approve transitions PENDENTE to ATIVO`() {
        val m = sampleMember(status = MemberStatus.PENDENTE, category = MemberCategory.SOCIO, membershipQuota = 200)
        when (val res = domain.approve(m, LocalDate.parse("2025-01-02"))) {
            is Either.Right -> {
                assertEquals(MemberStatus.ATIVO, res.value.status)
                assertEquals(LocalDate.parse("2025-01-02"), res.value.approvalDate)
                assertEquals(200, res.value.membershipQuota)
            }

            is Either.Left -> fail("Expected success but got: ${res.value}")
        }
    }

    @Test
    fun `approve rejects already ATIVO`() {
        val res = domain.approve(sampleMember(status = MemberStatus.ATIVO), LocalDate.parse("2025-01-02"))
        assertTrue(res is Either.Left)
        assertIs<MemberError.InvalidTransition>(res.value)
    }

    @Test
    fun `approve rejects when approvalDate before registrationDate`() {
        val m = sampleMember(status = MemberStatus.PENDENTE, registrationDate = LocalDate.parse("2025-01-03"))
        val res = domain.approve(m, LocalDate.parse("2025-01-02"))
        assertTrue(res is Either.Left)
        assertIs<MemberError.ValidationError>(res.value)
    }

    @Test
    fun `approve allowed on registrationDate itself`() {
        val m = sampleMember(status = MemberStatus.PENDENTE, registrationDate = LocalDate.parse("2025-05-01"))
        val res = domain.approve(m, LocalDate.parse("2025-05-01"))
        assertTrue(res is Either.Right)
        assertEquals(LocalDate.parse("2025-05-01"), res.value.approvalDate)
    }

    @Test
    fun `approve keeps the athlete quota set on the member for ATLETA_SOCIO`() {
        val atleta = sampleMember(status = MemberStatus.PENDENTE, category = MemberCategory.ATLETA_SOCIO, membershipQuota = 500)
        val res = domain.approve(atleta, LocalDate.parse("2025-04-01"))
        assertTrue(res is Either.Right)
        assertEquals(500, res.value.membershipQuota)
    }

    @Test
    fun `approve raises low quota for SOCIO to minimum`() {
        val socio = sampleMember(status = MemberStatus.PENDENTE, category = MemberCategory.SOCIO, membershipQuota = 100)
        val res = domain.approve(socio, LocalDate.parse("2025-04-01"))
        assertTrue(res is Either.Right)
        assertEquals(150, res.value.membershipQuota)
    }

    @Test
    fun `approve keeps high quota for SOCIO`() {
        val socio = sampleMember(status = MemberStatus.PENDENTE, category = MemberCategory.SOCIO, membershipQuota = 999)
        val res = domain.approve(socio, LocalDate.parse("2025-04-01"))
        assertTrue(res is Either.Right)
        assertEquals(999, res.value.membershipQuota)
    }

    // ---- reject ----

    @Test
    fun `reject transitions PENDENTE to REJEITADO`() {
        val res = domain.reject(sampleMember(status = MemberStatus.PENDENTE))
        assertTrue(res is Either.Right)
        assertEquals(MemberStatus.REJEITADO, res.value.status)
    }

    @Test
    fun `reject rejects ATIVO`() {
        val res = domain.reject(sampleMember(status = MemberStatus.ATIVO))
        assertTrue(res is Either.Left)
        assertIs<MemberError.InvalidTransition>(res.value)
    }

    @Test
    fun `reject rejects INATIVO`() {
        val res = domain.reject(sampleMember(status = MemberStatus.INATIVO))
        assertTrue(res is Either.Left)
        assertIs<MemberError.InvalidTransition>(res.value)
    }

    // ---- deactivate ----

    @Test
    fun `deactivate transitions ATIVO to INATIVO`() {
        val res = domain.deactivate(sampleMember(status = MemberStatus.ATIVO))
        assertTrue(res is Either.Right)
        assertEquals(MemberStatus.INATIVO, res.value.status)
    }

    @Test
    fun `deactivate rejects PENDENTE`() {
        val res = domain.deactivate(sampleMember(status = MemberStatus.PENDENTE))
        assertTrue(res is Either.Left)
        assertIs<MemberError.InvalidTransition>(res.value)
    }

    // ---- reactivate ----

    @Test
    fun `reactivate transitions INATIVO to ATIVO`() {
        val inactive = sampleMember(status = MemberStatus.INATIVO, registrationDate = LocalDate.parse("2025-01-01"))
        val res = domain.reactivate(inactive, LocalDate.parse("2025-02-01"))
        assertTrue(res is Either.Right)
        assertEquals(MemberStatus.ATIVO, res.value.status)
        assertEquals(LocalDate.parse("2025-02-01"), res.value.approvalDate)
    }

    @Test
    fun `reactivate rejects ATIVO`() {
        val res = domain.reactivate(sampleMember(status = MemberStatus.ATIVO), LocalDate.parse("2025-02-01"))
        assertTrue(res is Either.Left)
        assertIs<MemberError.InvalidTransition>(res.value)
    }

    @Test
    fun `reactivate rejects date before registration`() {
        val m = sampleMember(status = MemberStatus.INATIVO, registrationDate = LocalDate.parse("2025-03-01"))
        val res = domain.reactivate(m, LocalDate.parse("2025-02-01"))
        assertTrue(res is Either.Left)
        assertIs<MemberError.ValidationError>(res.value)
    }

    @Test
    fun `reactivate raises low quota for SOCIO to minimum`() {
        val m = sampleMember(status = MemberStatus.INATIVO, category = MemberCategory.SOCIO, membershipQuota = 50)
        val res = domain.reactivate(m, LocalDate.parse("2025-06-01"))
        assertTrue(res is Either.Right)
        assertEquals(150, res.value.membershipQuota)
    }

    @Test
    fun `reactivate keeps the athlete quota set on the member for ATLETA_SOCIO`() {
        val m = sampleMember(status = MemberStatus.INATIVO, category = MemberCategory.ATLETA_SOCIO, membershipQuota = 300)
        val res = domain.reactivate(m, LocalDate.parse("2025-06-01"))
        assertTrue(res is Either.Right)
        assertEquals(300, res.value.membershipQuota)
    }

    // ---- updateContact ----

    @Test
    fun `updateContact accepts valid contact info`() {
        val res =
            domain.updateContact(
                sampleMember(),
                email = "new@example.com",
                phone = "999999999",
                address = "Rua",
                postalCode = "1000-200",
                city = "Porto",
            )
        assertTrue(res is Either.Right)
        assertEquals("new@example.com", res.value.email)
        assertEquals("999999999", res.value.phone)
        assertEquals("Porto", res.value.city)
    }

    @Test
    fun `updateContact rejects blank email`() {
        val res =
            domain.updateContact(
                sampleMember(),
                email = "",
                phone = "999999999",
                address = "Rua",
                postalCode = "1000-200",
                city = "Porto",
            )
        assertTrue(res is Either.Left)
        assertIs<MemberError.ValidationError>(res.value)
    }

    @Test
    fun `updateContact rejects invalid email`() {
        val res =
            domain.updateContact(
                sampleMember(),
                email = "bad",
                phone = "999999999",
                address = "Rua",
                postalCode = "1000-200",
                city = "Porto",
            )
        assertTrue(res is Either.Left)
        assertIs<MemberError.ValidationError>(res.value)
    }

    @Test
    fun `updateContact rejects malformed postalCode`() {
        val res =
            domain.updateContact(
                sampleMember(),
                email = "ok@example.com",
                phone = "999999999",
                address = "Rua",
                postalCode = "ABC",
                city = "Porto",
            )
        assertTrue(res is Either.Left)
        assertIs<MemberError.ValidationError>(res.value)
    }

    @Test
    fun `updateContact preserves optional homePhone and billingLocation`() {
        val res =
            domain.updateContact(
                sampleMember(),
                email = "opt@example.com",
                phone = "911111111",
                address = "Rua 2",
                postalCode = "2000-200",
                city = "Coimbra",
                homePhone = "214444444",
                billingLocation = "Banco X",
            )
        assertTrue(res is Either.Right)
        assertEquals("214444444", res.value.homePhone)
        assertEquals("Banco X", res.value.billingLocation)
    }

    // ---- changeCategory ----

    @Test
    fun `changeCategory SOCIO to ATLETA_SOCIO sets athlete quota`() {
        val m = sampleMember(category = MemberCategory.SOCIO, membershipQuota = 500)
        val res = domain.changeCategory(m, MemberCategory.ATLETA_SOCIO)
        assertTrue(res is Either.Right)
        assertEquals(MemberCategory.ATLETA_SOCIO, res.value.category)
        assertEquals(ATHLETE_MEMBER_QUOTA, res.value.membershipQuota)
    }

    @Test
    fun `changeCategory ATLETA_SOCIO to SOCIO raises quota to minimum`() {
        val m = sampleMember(category = MemberCategory.ATLETA_SOCIO, membershipQuota = 0)
        val res = domain.changeCategory(m, MemberCategory.SOCIO)
        assertTrue(res is Either.Right)
        assertEquals(MemberCategory.SOCIO, res.value.category)
        assertEquals(150, res.value.membershipQuota)
    }

    @Test
    fun `changeCategory rejects same category as Conflict`() {
        val res = domain.changeCategory(sampleMember(category = MemberCategory.SOCIO), MemberCategory.SOCIO)
        assertTrue(res is Either.Left)
        assertIs<MemberError.Conflict>(res.value)
    }

    // ---- calculateMembershipQuota ----

    @Test
    fun `calculateMembershipQuota keeps the member quota for ATLETA_SOCIO`() {
        val m = sampleMember(category = MemberCategory.ATLETA_SOCIO, membershipQuota = 1000)
        assertEquals(1000, domain.calculateMembershipQuota(m))
    }

    @Test
    fun `calculateMembershipQuota raises to minimum for SOCIO with low quota`() {
        val m = sampleMember(category = MemberCategory.SOCIO, membershipQuota = 100)
        assertEquals(150, domain.calculateMembershipQuota(m))
    }

    @Test
    fun `calculateMembershipQuota keeps high quota for SOCIO`() {
        val m = sampleMember(category = MemberCategory.SOCIO, membershipQuota = 1000)
        assertEquals(1000, domain.calculateMembershipQuota(m))
    }

    // ---- validateForCreation ----

    @Test
    fun `validateForCreation accepts valid member`() {
        val res = domain.validateForCreation(sampleMember())
        assertTrue(res is Either.Right)
    }

    @Test
    fun `validateForCreation rejects blank completeName`() {
        val res = domain.validateForCreation(sampleMember().copy(completeName = ""))
        assertTrue(res is Either.Left)
        val err = assertIs<MemberError.ValidationError>(res.value)
        assertTrue(err.message.contains("completeName"))
    }

    @Test
    fun `validateForCreation rejects invalid email`() {
        val res = domain.validateForCreation(sampleMember().copy(email = "no-at-symbol"))
        assertTrue(res is Either.Left)
        assertIs<MemberError.ValidationError>(res.value)
    }

    @Test
    fun `validateForCreation rejects negative quota`() {
        val res = domain.validateForCreation(sampleMember().copy(membershipQuota = -100))
        assertTrue(res is Either.Left)
        assertIs<MemberError.ValidationError>(res.value)
    }

    @Test
    fun `validateForCreation rejects malformed nif`() {
        val res = domain.validateForCreation(sampleMember().copy(nif = "12"))
        assertTrue(res is Either.Left)
        val err = assertIs<MemberError.ValidationError>(res.value)
        assertTrue(err.message.contains("nif"))
    }

    @Test
    fun `validateForCreation rejects malformed phone`() {
        val res = domain.validateForCreation(sampleMember().copy(phone = "abc"))
        assertTrue(res is Either.Left)
        val err = assertIs<MemberError.ValidationError>(res.value)
        assertTrue(err.message.contains("phone"))
    }

    @Test
    fun `validateForCreation rejects malformed postalCode`() {
        val res = domain.validateForCreation(sampleMember().copy(postalCode = "ABC"))
        assertTrue(res is Either.Left)
        val err = assertIs<MemberError.ValidationError>(res.value)
        assertTrue(err.message.contains("postalCode"))
    }

    @Test
    fun `validateForCreation rejects birthDate equal to registrationDate`() {
        val d = LocalDate.parse("2025-01-01")
        val res = domain.validateForCreation(sampleMember().copy(birthDate = d, registrationDate = d))
        assertTrue(res is Either.Left)
        val err = assertIs<MemberError.ValidationError>(res.value)
        assertTrue(err.message.contains("birthDate"))
    }

    @Test
    fun `validateForCreation rejects unrealistic birthDate`() {
        val res = domain.validateForCreation(sampleMember().copy(birthDate = LocalDate.parse("1800-01-01")))
        assertTrue(res is Either.Left)
        assertIs<MemberError.ValidationError>(res.value)
    }

    // ---- MemberError variants ----

    @Test
    fun `MemberError InvalidTransition carries from and attempted`() {
        val err = MemberError.InvalidTransition(MemberStatus.ATIVO, "approve")
        assertEquals(MemberStatus.ATIVO, err.from)
        assertEquals("approve", err.attempted)
    }

    @Test
    fun `MemberError InvalidOperation carries operation and reason`() {
        val err = MemberError.InvalidOperation("approve", "missing approvalDate")
        assertEquals("approve", err.operation)
        assertEquals("missing approvalDate", err.reason)
    }

    @Test
    fun `MemberError Conflict carries message`() {
        val err = MemberError.Conflict("category already SOCIO")
        assertEquals("category already SOCIO", err.message)
    }

    @Test
    fun `MemberError ValidationError carries message`() {
        val err = MemberError.ValidationError("email is invalid")
        assertEquals("email is invalid", err.message)
    }

    @Test
    fun `MemberError Unauthorized has default and custom message`() {
        assertEquals("Unauthorized", MemberError.Unauthorized().message)
        assertEquals("custom", MemberError.Unauthorized("custom").message)
    }

    @Test
    fun `MemberError Forbidden has default and custom message`() {
        assertEquals("Forbidden", MemberError.Forbidden().message)
        assertEquals("nope", MemberError.Forbidden("nope").message)
    }

    @Test
    fun `MemberError AlreadyExists includes entity field and value in toString`() {
        val err = MemberError.AlreadyExists("Member", "email", "x@y.z")
        assertEquals("Member", err.entity)
        assertEquals("email", err.field)
        assertEquals("x@y.z", err.value)
        assertEquals("Member with email 'x@y.z' already exists", err.toString())
    }

    @Test
    fun `MemberError NotFound carries entity and id`() {
        val err = MemberError.NotFound("Member", 42L)
        assertEquals("Member", err.entity)
        assertEquals(42L, err.id)
    }

    @Test
    fun `MemberError DomainError carries message`() {
        val err = MemberError.DomainError("something")
        assertEquals("something", err.message)
    }

    @Test
    fun `MemberError equality follows data class semantics`() {
        assertEquals(MemberError.ValidationError("x"), MemberError.ValidationError("x"))
        assertNotEquals<MemberError>(MemberError.ValidationError("x"), MemberError.ValidationError("y"))
        assertNotEquals<MemberError>(MemberError.ValidationError("x"), MemberError.DomainError("x"))
    }

    @Test
    fun `MemberError variants are exhaustively distinguishable`() {
        val errors: List<MemberError> =
            listOf(
                MemberError.InvalidTransition(MemberStatus.PENDENTE, "x"),
                MemberError.InvalidOperation("op", "r"),
                MemberError.Conflict("c"),
                MemberError.ValidationError("v"),
                MemberError.Unauthorized(),
                MemberError.Forbidden(),
                MemberError.AlreadyExists("E", "f", "v"),
                MemberError.NotFound("E", 1L),
                MemberError.DomainError("d"),
            )
        errors.forEach { e ->
            val label =
                when (e) {
                    is MemberError.InvalidTransition -> "it"
                    is MemberError.InvalidOperation -> "io"
                    is MemberError.Conflict -> "c"
                    is MemberError.ValidationError -> "v"
                    is MemberError.Unauthorized -> "u"
                    is MemberError.Forbidden -> "f"
                    is MemberError.AlreadyExists -> "ae"
                    is MemberError.NotFound -> "nf"
                    is MemberError.DomainError -> "d"
                }
            assertNotNull(label)
        }
    }

    @Test
    fun `approve InvalidTransition exposes prior status`() {
        val res = domain.approve(sampleMember(status = MemberStatus.INATIVO), LocalDate.parse("2025-02-01"))
        assertTrue(res is Either.Left)
        val err = assertIs<MemberError.InvalidTransition>(res.value)
        assertEquals(MemberStatus.INATIVO, err.from)
        assertEquals("approve", err.attempted)
    }

    @Test
    fun `reject InvalidTransition exposes prior status and attempted`() {
        val res = domain.reject(sampleMember(status = MemberStatus.REJEITADO))
        assertTrue(res is Either.Left)
        val err = assertIs<MemberError.InvalidTransition>(res.value)
        assertEquals(MemberStatus.REJEITADO, err.from)
        assertEquals("reject", err.attempted)
    }

    @Test
    fun `deactivate InvalidTransition exposes prior status`() {
        val res = domain.deactivate(sampleMember(status = MemberStatus.INATIVO))
        assertTrue(res is Either.Left)
        val err = assertIs<MemberError.InvalidTransition>(res.value)
        assertEquals(MemberStatus.INATIVO, err.from)
        assertEquals("deactivate", err.attempted)
    }

    @Test
    fun `reactivate InvalidTransition exposes prior status`() {
        val res = domain.reactivate(sampleMember(status = MemberStatus.PENDENTE), LocalDate.parse("2025-02-01"))
        assertTrue(res is Either.Left)
        val err = assertIs<MemberError.InvalidTransition>(res.value)
        assertEquals(MemberStatus.PENDENTE, err.from)
        assertEquals("reactivate", err.attempted)
    }

    @Test
    fun `changeCategory Conflict message names target category`() {
        val res = domain.changeCategory(sampleMember(category = MemberCategory.SOCIO), MemberCategory.SOCIO)
        assertTrue(res is Either.Left)
        val err = assertIs<MemberError.Conflict>(res.value)
        assertTrue(err.message.contains("SOCIO"))
    }

    @Test
    fun `validateForCreation error message contains failing field name`() {
        val blankAddress = domain.validateForCreation(sampleMember().copy(address = ""))
        assertTrue(blankAddress is Either.Left)
        val err = assertIs<MemberError.ValidationError>(blankAddress.value)
        assertTrue(err.message.contains("address"))
    }
}
