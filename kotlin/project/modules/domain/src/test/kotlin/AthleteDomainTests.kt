package pt.isel.jagoz.athlete

import kotlinx.datetime.LocalDate
import pt.isel.jagoz.domain.athlete.Athlete
import pt.isel.jagoz.domain.athlete.AthleteDomain
import pt.isel.jagoz.domain.athlete.AthleteError
import pt.isel.jagoz.domain.athlete.Guardian
import pt.isel.jagoz.domain.athlete.GuardianRole
import pt.isel.jagoz.domain.team.TeamCategory
import pt.isel.jagoz.domain.utils.Either
import pt.isel.jagoz.domain.utils.ValidationError
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertIs
import kotlin.test.assertNotEquals
import kotlin.test.assertNotNull
import kotlin.test.assertTrue

class AthleteDomainTests {
    private val domain = AthleteDomain()

    private val sampleTeamCategory =
        TeamCategory(
            teamId = 1,
            teamGroupId = 1,
            code = "JUN",
            label = "Juniores",
            active = true,
            sortOrder = 1,
        )

    private fun sampleAthlete(
        active: Boolean = true,
        guardians: List<Guardian> = emptyList(),
    ) = Athlete(
        athleteId = 1,
        memberId = 1,
        nationality = "PT",
        niss = "98765432123",
        numeroUtente = "111222333",
        bi = "12345678",
        biExpirationDate = LocalDate.parse("2030-01-01"),
        school = "Escola X",
        schoolYear = "10",
        schoolClass = "A",
        lastClub = "Club Y",
        season = "2025/2026",
        teamCategory = sampleTeamCategory,
        active = active,
        guardians = guardians,
    )

    private fun fatherGuardian() =
        Guardian(
            guardianId = 10,
            athleteId = 1,
            memberId = null,
            name = "Pai do Atleta",
            role = GuardianRole.FATHER,
            kinship = null,
            email = "pai@example.com",
            phone = "912345678",
            professionalActivity = "Engenheiro",
            contactPhone = null,
        )

    private fun legalGuardian() =
        Guardian(
            guardianId = 11,
            athleteId = 1,
            memberId = null,
            name = "Encarregado Legal",
            role = GuardianRole.LEGAL_GUARDIAN,
            kinship = "Tio",
            email = "tio@example.com",
            phone = "919999999",
            professionalActivity = null,
            contactPhone = "919999000",
        )

    // ---- validateForCreation ----

    @Test
    fun `validateForCreation succeeds with valid athlete`() {
        val res = domain.validateForCreation(sampleAthlete())
        assertTrue(res is Either.Right)
        assertEquals(sampleAthlete(), res.value)
    }

    @Test
    fun `validateForCreation fails for blank nationality`() {
        val res = domain.validateForCreation(sampleAthlete().copy(nationality = ""))
        assertTrue(res is Either.Left)
        val err = assertIs<ValidationError.FieldError>(res.value)
        assertEquals("nationality", err.field)
    }

    @Test
    fun `validateForCreation fails for blank bi`() {
        val res = domain.validateForCreation(sampleAthlete().copy(bi = ""))
        assertTrue(res is Either.Left)
        val err = assertIs<ValidationError.FieldError>(res.value)
        assertEquals("bi", err.field)
    }

    @Test
    fun `validateForCreation fails for niss wrong format`() {
        val res = domain.validateForCreation(sampleAthlete().copy(niss = "123"))
        assertTrue(res is Either.Left)
        val err = assertIs<ValidationError.FieldError>(res.value)
        assertEquals("niss", err.field)
    }

    @Test
    fun `validateForCreation fails for bi wrong format`() {
        val res = domain.validateForCreation(sampleAthlete().copy(bi = "ABC@!#  "))
        assertTrue(res is Either.Left)
        assertIs<ValidationError.FieldError>(res.value)
    }

    @Test
    fun `validateForCreation fails for biExpirationDate too old`() {
        val res = domain.validateForCreation(sampleAthlete().copy(biExpirationDate = LocalDate.parse("1990-01-01")))
        assertTrue(res is Either.Left)
        val err = assertIs<ValidationError.FieldError>(res.value)
        assertEquals("biExpirationDate", err.field)
    }

    @Test
    fun `validateForCreation fails for numeroUtente wrong format`() {
        val res = domain.validateForCreation(sampleAthlete().copy(numeroUtente = "12"))
        assertTrue(res is Either.Left)
        val err = assertIs<ValidationError.FieldError>(res.value)
        assertEquals("numeroUtente", err.field)
    }

    @Test
    fun `validateForCreation propagates guardian validation errors`() {
        val badGuardian = fatherGuardian().copy(email = "")
        val res = domain.validateForCreation(sampleAthlete(guardians = listOf(badGuardian)))
        assertTrue(res is Either.Left)
        val err = assertIs<ValidationError.FieldError>(res.value)
        assertEquals("email", err.field)
    }

    // ---- validateGuardianForCreation ----

    @Test
    fun `validateGuardianForCreation accepts valid FATHER`() {
        val res = domain.validateGuardianForCreation(fatherGuardian())
        assertTrue(res is Either.Right)
    }

    @Test
    fun `validateGuardianForCreation accepts valid MOTHER`() {
        val mother = fatherGuardian().copy(role = GuardianRole.MOTHER, name = "Mae do Atleta")
        val res = domain.validateGuardianForCreation(mother)
        assertTrue(res is Either.Right)
    }

    @Test
    fun `validateGuardianForCreation accepts valid LEGAL_GUARDIAN`() {
        val res = domain.validateGuardianForCreation(legalGuardian())
        assertTrue(res is Either.Right)
    }

    @Test
    fun `validateGuardianForCreation fails when LEGAL_GUARDIAN missing kinship`() {
        val res = domain.validateGuardianForCreation(legalGuardian().copy(kinship = null))
        assertTrue(res is Either.Left)
        val err = assertIs<ValidationError.FieldError>(res.value)
        assertEquals("kinship", err.field)
    }

    @Test
    fun `validateGuardianForCreation fails when LEGAL_GUARDIAN missing contactPhone`() {
        val res = domain.validateGuardianForCreation(legalGuardian().copy(contactPhone = null))
        assertTrue(res is Either.Left)
        val err = assertIs<ValidationError.FieldError>(res.value)
        assertEquals("contactPhone", err.field)
    }

    @Test
    fun `validateGuardianForCreation fails when LEGAL_GUARDIAN contactPhone malformed`() {
        val res = domain.validateGuardianForCreation(legalGuardian().copy(contactPhone = "abc"))
        assertTrue(res is Either.Left)
        val err = assertIs<ValidationError.FieldError>(res.value)
        assertEquals("contactPhone", err.field)
    }

    @Test
    fun `validateGuardianForCreation fails when FATHER without professionalActivity`() {
        val res = domain.validateGuardianForCreation(fatherGuardian().copy(professionalActivity = null))
        assertTrue(res is Either.Left)
        val err = assertIs<ValidationError.FieldError>(res.value)
        assertEquals("professionalActivity", err.field)
    }

    @Test
    fun `validateGuardianForCreation fails for blank name`() {
        val res = domain.validateGuardianForCreation(fatherGuardian().copy(name = ""))
        assertTrue(res is Either.Left)
        val err = assertIs<ValidationError.FieldError>(res.value)
        assertEquals("name", err.field)
    }

    @Test
    fun `validateGuardianForCreation fails for invalid email`() {
        val res = domain.validateGuardianForCreation(fatherGuardian().copy(email = "not-an-email"))
        assertTrue(res is Either.Left)
        val err = assertIs<ValidationError.FieldError>(res.value)
        assertEquals("email", err.field)
    }

    @Test
    fun `validateGuardianForCreation fails for invalid phone`() {
        val res = domain.validateGuardianForCreation(fatherGuardian().copy(phone = "abc"))
        assertTrue(res is Either.Left)
        val err = assertIs<ValidationError.FieldError>(res.value)
        assertEquals("phone", err.field)
    }

    // ---- changeTeamCategory ----

    @Test
    fun `changeTeamCategory moves athlete to new category`() {
        val newCat =
            TeamCategory(
                teamId = 2,
                teamGroupId = 1,
                code = "SEN",
                label = "Seniores",
                active = true,
                sortOrder = 2,
            )
        val res = domain.changeTeamCategory(sampleAthlete(), newCat)
        assertTrue(res is Either.Right)
        assertEquals(newCat, res.value.teamCategory)
    }

    @Test
    fun `changeTeamCategory rejects same category`() {
        val res = domain.changeTeamCategory(sampleAthlete(), sampleTeamCategory)
        assertTrue(res is Either.Left)
        assertIs<AthleteError.DomainError>(res.value)
    }

    // ---- markInactive / reactivate ----

    @Test
    fun `markInactive flips active flag on active athlete`() {
        val res = domain.markInactive(sampleAthlete(active = true))
        assertTrue(res is Either.Right)
        assertFalse(res.value.active)
    }

    @Test
    fun `markInactive rejects already inactive athlete`() {
        val res = domain.markInactive(sampleAthlete(active = false))
        assertTrue(res is Either.Left)
        val err = assertIs<AthleteError.InvalidStateTransition>(res.value)
        assertEquals("INATIVO", err.currentStatus)
    }

    @Test
    fun `reactivate flips active flag on inactive athlete`() {
        val res = domain.reactivate(sampleAthlete(active = false))
        assertTrue(res is Either.Right)
        assertTrue(res.value.active)
    }

    @Test
    fun `reactivate rejects already active athlete`() {
        val res = domain.reactivate(sampleAthlete(active = true))
        assertTrue(res is Either.Left)
        val err = assertIs<AthleteError.InvalidStateTransition>(res.value)
        assertEquals("ATIVO", err.currentStatus)
    }

    // ---- updateDocuments ----

    @Test
    fun `updateDocuments applies new values`() {
        val res =
            domain.updateDocuments(
                sampleAthlete(),
                niss = "22233344455",
                numeroUtente = "555666777",
                bi = "BB999888",
                biExpirationDate = LocalDate.parse("2031-01-01"),
            )
        assertTrue(res is Either.Right)
        assertEquals("BB999888", res.value.bi)
        assertEquals("22233344455", res.value.niss)
        assertEquals("555666777", res.value.numeroUtente)
        assertEquals(LocalDate.parse("2031-01-01"), res.value.biExpirationDate)
    }

    @Test
    fun `updateDocuments rejects blank niss`() {
        val res =
            domain.updateDocuments(
                sampleAthlete(),
                niss = "",
                numeroUtente = "555666777",
                bi = "BB999888",
                biExpirationDate = LocalDate.parse("2031-01-01"),
            )
        assertTrue(res is Either.Left)
        assertIs<AthleteError.ValidationError>(res.value)
    }

    @Test
    fun `updateDocuments rejects blank bi`() {
        val res =
            domain.updateDocuments(
                sampleAthlete(),
                niss = "22233344455",
                numeroUtente = "555666777",
                bi = "",
                biExpirationDate = LocalDate.parse("2031-01-01"),
            )
        assertTrue(res is Either.Left)
        assertIs<AthleteError.ValidationError>(res.value)
    }

    @Test
    fun `updateDocuments rejects blank numeroUtente`() {
        val res =
            domain.updateDocuments(
                sampleAthlete(),
                niss = "22233344455",
                numeroUtente = "",
                bi = "BB999888",
                biExpirationDate = LocalDate.parse("2031-01-01"),
            )
        assertTrue(res is Either.Left)
        assertIs<AthleteError.ValidationError>(res.value)
    }

    @Test
    fun `updateDocuments rejects unrealistic biExpirationDate`() {
        val res =
            domain.updateDocuments(
                sampleAthlete(),
                niss = "22233344455",
                numeroUtente = "555666777",
                bi = "BB999888",
                biExpirationDate = LocalDate.parse("1990-01-01"),
            )
        assertTrue(res is Either.Left)
        assertIs<AthleteError.ValidationError>(res.value)
    }

    // ---- AthleteError variants ----

    @Test
    fun `AthleteError NotFound carries field and value`() {
        val err = AthleteError.NotFound("athleteId", 42L)
        assertEquals("athleteId", err.field)
        assertEquals(42L, err.value)
    }

    @Test
    fun `AthleteError InvalidOperation carries message`() {
        val err = AthleteError.InvalidOperation("cannot reactivate active athlete")
        assertEquals("cannot reactivate active athlete", err.message)
    }

    @Test
    fun `AthleteError ValidationError carries message`() {
        val err = AthleteError.ValidationError("niss cannot be blank")
        assertEquals("niss cannot be blank", err.message)
    }

    @Test
    fun `AthleteError DomainError carries message`() {
        val err = AthleteError.DomainError("already in category SENIORES")
        assertEquals("already in category SENIORES", err.message)
    }

    @Test
    fun `AthleteError AlreadyRegistered carries userId`() {
        val err = AthleteError.AlreadyRegistered(7L)
        assertEquals(7L, err.userId)
    }

    @Test
    fun `AthleteError TeamCategoryNotFound carries teamCategoryId`() {
        val err = AthleteError.TeamCategoryNotFound(99L)
        assertEquals(99L, err.teamCategoryId)
    }

    @Test
    fun `AthleteError GuardianMemberNotFound carries memberNumber`() {
        val err = AthleteError.GuardianMemberNotFound(12)
        assertEquals(12, err.memberNumber)
    }

    @Test
    fun `AthleteError InvalidStateTransition carries athleteId currentStatus and attempted`() {
        val err = AthleteError.InvalidStateTransition(athleteId = 1L, currentStatus = "ATIVO", attempted = "reactivate")
        assertEquals(1L, err.athleteId)
        assertEquals("ATIVO", err.currentStatus)
        assertEquals("reactivate", err.attempted)
    }

    @Test
    fun `AthleteError InvalidDateField carries field and reason`() {
        val err = AthleteError.InvalidDateField("biExpirationDate", "in the past")
        assertEquals("biExpirationDate", err.field)
        assertEquals("in the past", err.reason)
    }

    @Test
    fun `AthleteError equality follows data class semantics`() {
        assertEquals(AthleteError.ValidationError("x"), AthleteError.ValidationError("x"))
        assertNotEquals<AthleteError>(AthleteError.ValidationError("x"), AthleteError.ValidationError("y"))
        assertNotEquals<AthleteError>(AthleteError.ValidationError("x"), AthleteError.DomainError("x"))
    }

    @Test
    fun `AthleteError variants are exhaustively distinguishable`() {
        val errors: List<AthleteError> =
            listOf(
                AthleteError.NotFound("id", 1L),
                AthleteError.InvalidOperation("op"),
                AthleteError.ValidationError("v"),
                AthleteError.DomainError("d"),
                AthleteError.AlreadyRegistered(1L),
                AthleteError.TeamCategoryNotFound(1L),
                AthleteError.GuardianMemberNotFound(1),
                AthleteError.InvalidStateTransition(1L, "ATIVO", "x"),
                AthleteError.InvalidDateField("f", "r"),
            )
        errors.forEach { e ->
            val label =
                when (e) {
                    is AthleteError.NotFound -> "nf"
                    is AthleteError.InvalidOperation -> "io"
                    is AthleteError.ValidationError -> "v"
                    is AthleteError.DomainError -> "d"
                    is AthleteError.AlreadyRegistered -> "ar"
                    is AthleteError.TeamCategoryNotFound -> "tcnf"
                    is AthleteError.GuardianMemberNotFound -> "gmnf"
                    is AthleteError.InvalidStateTransition -> "ist"
                    is AthleteError.InvalidDateField -> "idf"
                }
            assertEquals(9, errors.size)
            assertNotNull(label)
        }
    }

    @Test
    fun `markInactive returns InvalidStateTransition with correct fields`() {
        val res = domain.markInactive(sampleAthlete(active = false))
        assertTrue(res is Either.Left)
        val err = assertIs<AthleteError.InvalidStateTransition>(res.value)
        assertEquals(1L, err.athleteId)
        assertEquals("INATIVO", err.currentStatus)
        assertEquals("deactivate", err.attempted)
    }

    @Test
    fun `reactivate returns InvalidStateTransition with correct fields`() {
        val res = domain.reactivate(sampleAthlete(active = true))
        assertTrue(res is Either.Left)
        val err = assertIs<AthleteError.InvalidStateTransition>(res.value)
        assertEquals(1L, err.athleteId)
        assertEquals("ATIVO", err.currentStatus)
        assertEquals("reactivate", err.attempted)
    }

    @Test
    fun `changeTeamCategory error message mentions target category label`() {
        val res = domain.changeTeamCategory(sampleAthlete(), sampleTeamCategory)
        assertTrue(res is Either.Left)
        val err = assertIs<AthleteError.DomainError>(res.value)
        assertTrue(err.message.contains("already in category"))
    }

    @Test
    fun `updateDocuments error message identifies offending field`() {
        val blankNiss =
            domain.updateDocuments(sampleAthlete(), "", "555666777", "BB999888", LocalDate.parse("2031-01-01"))
        assertTrue(blankNiss is Either.Left)
        val nissErr = assertIs<AthleteError.ValidationError>(blankNiss.value)
        assertTrue(nissErr.message.contains("niss"))

        val blankBi =
            domain.updateDocuments(sampleAthlete(), "22233344455", "555666777", "", LocalDate.parse("2031-01-01"))
        assertTrue(blankBi is Either.Left)
        val biErr = assertIs<AthleteError.ValidationError>(blankBi.value)
        assertTrue(biErr.message.contains("bi"))

        val blankUtente =
            domain.updateDocuments(sampleAthlete(), "22233344455", "", "BB999888", LocalDate.parse("2031-01-01"))
        assertTrue(blankUtente is Either.Left)
        val utenteErr = assertIs<AthleteError.ValidationError>(blankUtente.value)
        assertTrue(utenteErr.message.contains("numeroUtente"))
    }
}
