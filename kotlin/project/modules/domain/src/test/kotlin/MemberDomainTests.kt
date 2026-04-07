package pt.isel.member

import kotlinx.datetime.LocalDate
import pt.isel.utils.Either
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue
import kotlin.test.fail

class MemberDomainTests {
    private fun sampleMember(
        status: MemberStatus = MemberStatus.PENDENTE,
        category: MemberCategory = MemberCategory.SOCIO,
        monthlyQuota: Double = 2.0,
        registrationDate: LocalDate = LocalDate.parse("2025-01-01"),
    ) = Member(
        memberId = 1,
        memberNumber = 42,
        completeName = "José Manel",
        birthDate = LocalDate.parse("2000-01-01"),
        email = "joséManel@example.com",
        phone = "912345678",
        homePhone = null,
        address = "Rua Exemplo 1",
        postalCode = "1000-001",
        city = "Lisboa",
        category = category,
        formerMember = false,
        status = status,
        monthlyQuota = monthlyQuota,
        billingLocation = null,
        registrationDate = registrationDate,
        approvalDate = null,

    )

    @Test
    fun approve_success() {
        val m = sampleMember(status = MemberStatus.PENDENTE, category = MemberCategory.SOCIO, monthlyQuota = 2.0)
        when (val res = MemberDomain.approve(m, LocalDate.parse("2025-01-02"))) {
            is Either.Right -> {
                val updated = res.value
                assertEquals(MemberStatus.ATIVO, updated.status)
                assertEquals(LocalDate.parse("2025-01-02"), updated.approvalDate)
                assertEquals(2.0, updated.monthlyQuota)
            }
            is Either.Left -> fail("Expected success but got error: ${'$'}{res.value}")
        }
    }

    @Test
    fun approve_invalid_status() {
        val m = sampleMember(status = MemberStatus.ATIVO)
        val res = MemberDomain.approve(m, LocalDate.parse("2025-01-02"))
        assertTrue(res is Either.Left)
        val err = res.value
        assertTrue(err is MemberError.InvalidTransition)
    }

    @Test
    fun approve_invalid_date() {
        val m = sampleMember(status = MemberStatus.PENDENTE, registrationDate = LocalDate.parse("2025-01-03"))
        val res = MemberDomain.approve(m, LocalDate.parse("2025-01-02"))
        assertTrue(res is Either.Left)
        val err = res.value
        assertTrue(err is MemberError.ValidationError)
    }

    @Test
    fun reject_success_and_failure() {
        val pending = sampleMember(status = MemberStatus.PENDENTE)
        val ok = MemberDomain.reject(pending)
        assertTrue(ok is Either.Right)
        assertEquals(MemberStatus.REJEITADO, ok.value.status)

        val notPending = sampleMember(status = MemberStatus.ATIVO)
        val fail = MemberDomain.reject(notPending)
        assertTrue(fail is Either.Left)
        assertTrue(fail.value is MemberError.InvalidTransition)
    }

    @Test
    fun deactivate_success_and_failure() {
        val active = sampleMember(status = MemberStatus.ATIVO)
        val ok = MemberDomain.deactivate(active)
        assertTrue(ok is Either.Right)
        assertEquals(MemberStatus.INATIVO, ok.value.status)

        val notActive = sampleMember(status = MemberStatus.PENDENTE)
        val fail = MemberDomain.deactivate(notActive)
        assertTrue(fail is Either.Left)
        assertTrue(fail.value is MemberError.InvalidTransition)
    }

    @Test
    fun reactivate_success_and_failures() {
        val inactive = sampleMember(status = MemberStatus.INATIVO, registrationDate = LocalDate.parse("2025-01-01"))
        val ok = MemberDomain.reactivate(inactive, LocalDate.parse("2025-02-01"))
        assertTrue(ok is Either.Right)
        assertEquals(MemberStatus.ATIVO, ok.value.status)
        assertEquals(LocalDate.parse("2025-02-01"), ok.value.approvalDate)

        val notInactive = sampleMember(status = MemberStatus.ATIVO)
        val fail1 = MemberDomain.reactivate(notInactive, LocalDate.parse("2025-02-01"))
        assertTrue(fail1 is Either.Left)
        assertTrue(fail1.value is MemberError.InvalidTransition)

        val badDate = sampleMember(status = MemberStatus.INATIVO, registrationDate = LocalDate.parse("2025-03-01"))
        val fail2 = MemberDomain.reactivate(badDate, LocalDate.parse("2025-02-01"))
        assertTrue(fail2 is Either.Left)
        assertTrue(fail2.value is MemberError.ValidationError)
    }

    @Test
    fun updateContact_valid_and_invalid() {
        val m = sampleMember()
        val ok = MemberDomain.updateContact(m, "new@example.com", "999999999", "Rua", "1000-200", "Porto")
        assertTrue(ok is Either.Right)
        val updated = ok.value
        assertEquals("new@example.com", updated.email)
        assertEquals("999999999", updated.phone)
        assertEquals("Porto", updated.city)

        val badEmail = MemberDomain.updateContact(m, "", "999", "Rua", "1000", "Cidade")
        assertTrue(badEmail is Either.Left)
        assertTrue(badEmail.value is MemberError.ValidationError)
    }

    @Test
    fun changeCategory_behavior() {
        val m = sampleMember(category = MemberCategory.SOCIO, monthlyQuota = 5.0)
        val toAthlete = MemberDomain.changeCategory(m, MemberCategory.ATLETA_SOCIO)
        assertTrue(toAthlete is Either.Right)
        val ath = toAthlete.value
        assertEquals(MemberCategory.ATLETA_SOCIO, ath.category)
        assertEquals(0.0, ath.monthlyQuota)

        val same = MemberDomain.changeCategory(m, MemberCategory.SOCIO)
        assertTrue(same is Either.Left)
        assertTrue(same.value is MemberError.DomainError)
    }

    @Test
    fun calculateMonthlyQuota_checks() {
        val a = sampleMember(category = MemberCategory.ATLETA_SOCIO, monthlyQuota = 10.0)
        assertEquals(0.0, MemberDomain.calculateMonthlyQuota(a))

        val s = sampleMember(category = MemberCategory.SOCIO, monthlyQuota = 1.0)
        assertEquals(1.5, MemberDomain.calculateMonthlyQuota(s))
    }

    @Test
    fun validateForCreation_cases() {
        val valid = sampleMember()
        val ok = MemberDomain.validateForCreation(valid)
        assertTrue(ok is Either.Right)

        val noName = valid.copy(completeName = "")
        val r1 = MemberDomain.validateForCreation(noName)
        assertTrue(r1 is Either.Left)
        assertTrue(r1.value is MemberError.ValidationError)

        val badEmail = valid.copy(email = "no-at-symbol")
        val r2 = MemberDomain.validateForCreation(badEmail)
        assertTrue(r2 is Either.Left)
        assertTrue(r2.value is MemberError.ValidationError)

        val negQuota = valid.copy(monthlyQuota = -1.0)
        val r3 = MemberDomain.validateForCreation(negQuota)
        assertTrue(r3 is Either.Left)
        assertTrue(r3.value is MemberError.ValidationError)
    }

    @Test
    fun approve_atleta_sets_zero_quota_and_socio_minimum() {
        val atleta = sampleMember(status = MemberStatus.PENDENTE, category = MemberCategory.ATLETA_SOCIO, monthlyQuota = 5.0)
        val r1 = MemberDomain.approve(atleta, LocalDate.parse("2025-04-01"))
        assertTrue(r1 is Either.Right)
        assertEquals(0.0, r1.value.monthlyQuota)

        val socio = sampleMember(status = MemberStatus.PENDENTE, category = MemberCategory.SOCIO, monthlyQuota = 1.0)
        val r2 = MemberDomain.approve(socio, LocalDate.parse("2025-04-01"))
        assertTrue(r2 is Either.Right)
        assertEquals(1.5, r2.value.monthlyQuota)
    }

    @Test
    fun approve_on_registration_date_is_allowed() {
        val m = sampleMember(status = MemberStatus.PENDENTE, registrationDate = LocalDate.parse("2025-05-01"))
        val res = MemberDomain.approve(m, LocalDate.parse("2025-05-01"))
        assertTrue(res is Either.Right)
        assertEquals(LocalDate.parse("2025-05-01"), res.value.approvalDate)
    }

    @Test
    fun reactivate_adjusts_quota_based_on_category() {
        val inactiveSocio = sampleMember(status = MemberStatus.INATIVO, category = MemberCategory.SOCIO, monthlyQuota = 0.5)
        val r1 = MemberDomain.reactivate(inactiveSocio, LocalDate.parse("2025-06-01"))
        assertTrue(r1 is Either.Right)
        assertEquals(1.5, r1.value.monthlyQuota)

        val inactiveAtleta = sampleMember(status = MemberStatus.INATIVO, category = MemberCategory.ATLETA_SOCIO, monthlyQuota = 3.0)
        val r2 = MemberDomain.reactivate(inactiveAtleta, LocalDate.parse("2025-06-01"))
        assertTrue(r2 is Either.Right)
        assertEquals(0.0, r2.value.monthlyQuota)
    }

    @Test
    fun updateContact_invalid_phone_fails_and_optionals_are_preserved() {
        val m = sampleMember()
        val badPhone = MemberDomain.updateContact(m, "valid@example.com", "", "Rua", "1000", "Cidade")
        assertTrue(badPhone is Either.Left)
        assertTrue(badPhone.value is MemberError.ValidationError)

        val withOptionals =
            MemberDomain.updateContact(
                m,
                "opt@example.com",
                "911111111",
                "Rua 2",
                "2000-200",
                "Coimbra",
                homePhone = "214444444",
                billingLocation = "Banco X",
            )
        assertTrue(withOptionals is Either.Right)
        val u = withOptionals.value
        assertEquals("214444444", u.homePhone)
        assertEquals("Banco X", u.billingLocation)
    }

    @Test
    fun changeCategory_athlete_to_socio_sets_minimum_quota_if_needed() {
        val m = sampleMember(category = MemberCategory.ATLETA_SOCIO, monthlyQuota = 0.0)
        val r = MemberDomain.changeCategory(m, MemberCategory.SOCIO)
        assertTrue(r is Either.Right)
        assertEquals(MemberCategory.SOCIO, r.value.category)
        assertEquals(1.5, r.value.monthlyQuota)
    }

    @Test
    fun calculateMonthlyQuota_keeps_large_quota_for_socios() {
        val s = sampleMember(category = MemberCategory.SOCIO, monthlyQuota = 10.0)
        assertEquals(10.0, MemberDomain.calculateMonthlyQuota(s))
    }
}
