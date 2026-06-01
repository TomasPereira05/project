package pt.isel.jagoz.http.model

import kotlinx.datetime.LocalDate
import pt.isel.jagoz.domain.member.Member
import pt.isel.jagoz.domain.member.MemberCategory
import pt.isel.jagoz.domain.member.MemberStatus
import pt.isel.jagoz.http.model.member.MemberCreateInput
import pt.isel.jagoz.http.model.member.MemberUpdateInput
import pt.isel.jagoz.http.model.member.toCandidate
import pt.isel.jagoz.http.model.member.toMember
import pt.isel.jagoz.http.model.member.tooutput
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNull

class MemberModelTests {
    @Test
    fun `create input maps all fields to domain member`() {
        val input =
            MemberCreateInput(
                memberId = 12,
                userId = 34,
                memberNumber = 1001,
                completeName = "Ana Costa",
                birthDate = "1990-07-22",
                birthplace = "Mafra",
                email = "ana@example.test",
                phone = "912345678",
                homePhone = "261000000",
                address = "Rua Um",
                postalCode = "2640-001",
                city = "Mafra",
                nif = "123456789",
                category = MemberCategory.SOCIO,
                formerMember = true,
                status = MemberStatus.ATIVO,
                membershipQuota = 200,
                billingLocation = "Ericeira",
                registrationDate = "2025-09-01",
                approvalDate = "2025-09-03",
                privacyAccepted = true,
                comsAccepted = false,
                linkedUsername = "ana",
            )

        val member = input.toMember()

        assertEquals(12, member.memberId)
        assertEquals(34, member.userId)
        assertEquals(1001, member.memberNumber)
        assertEquals("Ana Costa", member.completeName)
        assertEquals(LocalDate.parse("1990-07-22"), member.birthDate)
        assertEquals("Mafra", member.birthplace)
        assertEquals("ana@example.test", member.email)
        assertEquals("912345678", member.phone)
        assertEquals("261000000", member.homePhone)
        assertEquals("Rua Um", member.address)
        assertEquals("2640-001", member.postalCode)
        assertEquals("Mafra", member.city)
        assertEquals("123456789", member.nif)
        assertEquals(MemberCategory.SOCIO, member.category)
        assertEquals(MemberStatus.ATIVO, member.status)
        assertEquals(200, member.membershipQuota)
        assertEquals("Ericeira", member.billingLocation)
        assertEquals(LocalDate.parse("2025-09-01"), member.registrationDate)
        assertEquals(LocalDate.parse("2025-09-03"), member.approvalDate)
        assertEquals(true, member.privacyAccepted)
        assertEquals(false, member.comsAccepted)
    }

    @Test
    fun `update input maps to candidate with sentinel identity fields`() {
        val candidate =
            MemberUpdateInput(
                completeName = "Novo Nome",
                birthDate = "2001-02-03",
                birthplace = null,
                email = "novo@example.test",
                phone = "900000001",
                homePhone = null,
                address = "Rua Dois",
                postalCode = "1000-001",
                city = "Lisboa",
                nif = "987654321",
                category = MemberCategory.ATLETA_SOCIO,
                formerMember = false,
                membershipQuota = 0,
                billingLocation = null,
                privacyAccepted = true,
                comsAccepted = true,
            ).toCandidate()

        assertEquals(0, candidate.memberId)
        assertNull(candidate.userId)
        assertEquals(0, candidate.memberNumber)
        assertEquals(MemberStatus.PENDENTE, candidate.status)
        assertEquals(LocalDate.parse("9999-12-31"), candidate.registrationDate)
        assertNull(candidate.approvalDate)
        assertEquals("Novo Nome", candidate.completeName)
        assertEquals(LocalDate.parse("2001-02-03"), candidate.birthDate)
        assertEquals(MemberCategory.ATLETA_SOCIO, candidate.category)
    }

    @Test
    fun `domain member maps to output using string dates and enum names`() {
        val output =
            Member(
                memberId = 1,
                userId = 2,
                memberNumber = 1001,
                completeName = "Socio Teste",
                birthDate = LocalDate.parse("1980-01-02"),
                birthplace = "Lisboa",
                email = "socio@example.test",
                phone = "911111111",
                homePhone = null,
                address = "Rua",
                postalCode = "1000-001",
                city = "Lisboa",
                nif = "123456789",
                category = MemberCategory.SOCIO,
                formerMember = false,
                status = MemberStatus.ATIVO,
                membershipQuota = 150,
                billingLocation = null,
                registrationDate = LocalDate.parse("2024-09-01"),
                approvalDate = LocalDate.parse("2024-09-02"),
                privacyAccepted = true,
                comsAccepted = false,
            ).tooutput()

        assertEquals(1, output.memberId)
        assertEquals("1980-01-02", output.birthDate)
        assertEquals("SOCIO", output.category)
        assertEquals("ATIVO", output.status)
        assertEquals("2024-09-01", output.registrationDate)
        assertEquals("2024-09-02", output.approvalDate)
    }
}
