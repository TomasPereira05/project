package pt.isel.jagoz.athlete

import kotlinx.datetime.LocalDate
import pt.isel.jagoz.sponsor.TeamCategory
import pt.isel.jagoz.utils.Either
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class AthleteDomainTests {
    private val domain = AthleteDomain()

    private fun sampleAthlete(
        active: Boolean = true,
        teamCategory: TeamCategory = TeamCategory.JUNIORES,
    ) = Athlete(
        athleteId = 1,
        memberId = 1,
        nationality = "PT",
        birthplace = "Lisboa",
        birthdate = LocalDate.parse("2005-01-01"),
        email = "athlete@mail.com",
        phone = "912000111",
        postalCode = "1000-100",
        address = "Rua Antiga 1",
        city = "Lisboa",
        state = "PT",
        niss = "98765432123",
        nif = "123456789",
        numeroUtente = "111222333",
        bi = "12345678",
        biExpirationDate = LocalDate.parse("2030-01-01"),
        school = "Escola X",
        schoolYear = "10",
        schoolClass = "A",
        lastClub = "Club Y",
        season = "2025/2026",
        teamCategory = teamCategory,
        active = active,
    )

    @Test
    fun validateForCreation_success_and_failures() {
        val a = sampleAthlete()
        val ok = domain.validateForCreation(a)
        print(ok)
        assertTrue(ok is Either.Right)

        val badNif = a.copy(nif = "")
        val r1 = domain.validateForCreation(badNif)
        assertTrue(r1 is Either.Left)

        val badDate = a.copy(biExpirationDate = LocalDate.parse("1990-01-01"))
        val r2 = domain.validateForCreation(badDate)
        assertTrue(r2 is Either.Left)
    }

    @Test
    fun changeTeamCategory_behaviour() {
        val a = sampleAthlete(teamCategory = TeamCategory.JUNIORES)
        val r = domain.changeTeamCategory(a, TeamCategory.SENIORES)
        assertTrue(r is Either.Right)
        assertEquals(TeamCategory.SENIORES, r.value.teamCategory)

        val same = domain.changeTeamCategory(a, TeamCategory.JUNIORES)
        assertTrue(same is Either.Left)
    }

    @Test
    fun markInactive_and_reactivate() {
        val a = sampleAthlete(active = true)
        val inact = domain.markInactive(a)
        assertTrue(inact is Either.Right)
        assertFalse(inact.value.active)

        val re = domain.reactivate((inact).value)
        assertTrue(re is Either.Right)
        assertTrue(re.value.active)

        val alreadyActive = domain.reactivate(a)
        assertTrue(alreadyActive is Either.Left)
    }

    @Test
    fun updateSchoolInfo_and_documents() {
        val a = sampleAthlete()
        val changed = domain.updateSchoolInfo(a, "Escola Nova", "11", "B")
        assertTrue(changed is Either.Right)
        assertEquals("Escola Nova", changed.value.school)

        val docsOk = domain.updateDocuments(a, "222333444", "555666777", "000111222", "BB999888", LocalDate.Companion.parse("2031-01-01"))
        assertTrue(docsOk is Either.Right)
        assertEquals("BB999888", docsOk.value.bi)

        val docsBad = domain.updateDocuments(a, "", "", "", "", LocalDate.Companion.parse("1990-01-01"))
        assertTrue(docsBad is Either.Left)
    }
}
