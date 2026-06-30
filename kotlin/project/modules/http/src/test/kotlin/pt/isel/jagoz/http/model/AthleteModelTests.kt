package pt.isel.jagoz.http.model

import kotlinx.datetime.LocalDate
import pt.isel.jagoz.domain.athlete.Athlete
import pt.isel.jagoz.domain.athlete.Guardian
import pt.isel.jagoz.domain.athlete.GuardianRole
import pt.isel.jagoz.domain.member.Member
import pt.isel.jagoz.domain.member.MemberCategory
import pt.isel.jagoz.domain.member.MemberStatus
import pt.isel.jagoz.domain.team.TeamCategory
import pt.isel.jagoz.http.model.athlete.AthleteCreationInput
import pt.isel.jagoz.http.model.athlete.AthleteUpdateRequest
import pt.isel.jagoz.http.model.athlete.GuardianInput
import pt.isel.jagoz.http.model.athlete.toAdminOutput
import pt.isel.jagoz.http.model.athlete.toDetailOutput
import pt.isel.jagoz.http.model.athlete.toPublicOutput
import pt.isel.jagoz.http.model.athlete.toRegistrationInput
import pt.isel.jagoz.http.model.athlete.toServiceInput
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertNull
import kotlin.test.assertTrue

class AthleteModelTests {
    private val category =
        TeamCategory(
            teamId = 7,
            teamGroupId = 2,
            code = "JUNIORES",
            label = "Juniores",
            active = true,
            sortOrder = 3,
        )

    private fun member(status: MemberStatus = MemberStatus.ATIVO) =
        Member(
            memberId = 11,
            userId = 21,
            memberNumber = 1003,
            completeName = "Tiago Rocha",
            birthDate = LocalDate.parse("2010-05-18"),
            birthplace = "Mafra",
            email = "tiago@example.test",
            phone = "912345678",
            homePhone = null,
            address = "Rua",
            postalCode = "2640-001",
            city = "Mafra",
            nif = "123456789",
            category = MemberCategory.ATLETA_SOCIO,
            formerMember = false,
            status = status,
            membershipQuota = 0,
            billingLocation = null,
            registrationDate = LocalDate.parse("2025-09-01"),
            approvalDate = LocalDate.parse("2025-09-02"),
            privacyAccepted = true,
            comsAccepted = true,
        )

    private fun athlete(active: Boolean = true) =
        Athlete(
            athleteId = 5,
            memberId = 11,
            nationality = "Portuguesa",
            niss = "11122233301",
            numeroUtente = "300003001",
            bi = "CC30001",
            biExpirationDate = LocalDate.parse("2030-05-01"),
            school = "Escola",
            schoolYear = "9",
            schoolClass = "A",
            lastClub = "GD Teste",
            season = "2025/2026",
            teamCategory = category,
            jerseyNumber = 10,
            position = "Medio",
            photoUrl = "/api/files/1/public-athlete-photo",
            hasFamilyInClub = true,
            schoolCertificationAccepted = true,
            active = active,
            guardians =
                listOf(
                    Guardian(
                        guardianId = 3,
                        athleteId = listOf(5L),
                        memberId = null,
                        name = "Pai",
                        role = GuardianRole.FATHER,
                        kinship = null,
                        email = "pai@example.test",
                        phone = "911111111",
                        professionalActivity = "Professor",
                        contactPhone = null,
                    ),
                ),
        )

    @Test
    fun `public output calculates age after birthday and hides sensitive fields`() {
        val output = athlete().toPublicOutput(member(), LocalDate.parse("2026-05-18"))

        assertEquals(5, output.id)
        assertEquals("Tiago Rocha", output.nome)
        assertEquals(16, output.idade)
        assertEquals("JUNIORES", output.teamCategoryCode)
        assertEquals("Juniores", output.teamCategoryLabel)
        assertEquals(10, output.numero)
        assertEquals("Medio", output.posicao)
    }

    @Test
    fun `detail output calculates age before birthday and keeps current season list`() {
        val output = athlete().toDetailOutput(member(), LocalDate.parse("2026-05-17"))

        assertEquals(15, output.idade)
        assertEquals(listOf("2025/2026"), output.epocasRepresentadas)
        assertEquals("/api/files/1/public-athlete-photo", output.fotoUrl)
    }

    @Test
    fun `admin output derives status from member status and athlete active flag`() {
        assertEquals("ATIVO", athlete(active = true).toAdminOutput(member(MemberStatus.ATIVO)).status)
        assertEquals("INATIVO", athlete(active = false).toAdminOutput(member(MemberStatus.ATIVO)).status)
        assertEquals("PENDENTE", athlete(active = true).toAdminOutput(member(MemberStatus.PENDENTE)).status)
        assertEquals("REJEITADO", athlete(active = true).toAdminOutput(member(MemberStatus.REJEITADO)).status)
        assertEquals("INATIVO", athlete(active = true).toAdminOutput(member(MemberStatus.INATIVO)).status)
    }

    @Test
    fun `admin output includes complete sensitive athlete and guardian fields`() {
        val output = athlete().toAdminOutput(member())

        assertEquals("11122233301", output.niss)
        assertEquals("300003001", output.numeroUtente)
        assertEquals("CC30001", output.bi)
        assertEquals("2030-05-01", output.biExpirationDate)
        assertTrue(output.hasFamilyInClub)
        assertTrue(output.schoolCertificationAccepted)
        assertEquals(1, output.guardians.size)
        assertEquals("Pai", output.guardians.single().name)
        assertEquals("pai@example.test", output.guardians.single().email)
    }

    @Test
    fun `creation input maps to service registration input with parsed dates and guardians`() {
        val input =
            AthleteCreationInput(
                completeName = "Lara Nunes",
                birthDate = "2009-10-21",
                birthplace = "Mafra",
                email = "lara@example.test",
                phone = "900000001",
                homePhone = null,
                address = "Rua",
                postalCode = "2640-001",
                city = "Mafra",
                nif = "123456789",
                privacyAccepted = true,
                comsAccepted = false,
                nationality = "Portuguesa",
                niss = "11122233307",
                numeroUtente = "300003007",
                bi = "CC30007",
                biExpirationDate = "2031-09-11",
                school = "Secundaria",
                schoolYear = "10",
                schoolClass = "A",
                lastClub = "SU Sintrense",
                season = "2025/2026",
                teamCategoryId = 9,
                hasFamilyInClub = false,
                schoolCertificationAccepted = true,
                guardians =
                    listOf(
                        GuardianInput(
                            name = "Nuno",
                            role = GuardianRole.FATHER,
                            kinship = null,
                            email = "nuno@example.test",
                            phone = "911111111",
                            professionalActivity = "Tecnico",
                            contactPhone = null,
                            memberNumber = 1001,
                        ),
                    ),
                isSelfRegistration = true,
            )

        val serviceInput = input.toRegistrationInput(userId = 77, registrationDate = LocalDate.parse("2026-05-01"))

        assertEquals(77, serviceInput.userId)
        assertEquals(LocalDate.parse("2009-10-21"), serviceInput.birthDate)
        assertEquals(LocalDate.parse("2031-09-11"), serviceInput.biExpirationDate)
        assertEquals(LocalDate.parse("2026-05-01"), serviceInput.registrationDate)
        assertEquals(9, serviceInput.teamCategoryId)
        assertFalse(serviceInput.hasFamilyInClub)
        assertEquals(1, serviceInput.guardians.size)
        assertEquals(1001, serviceInput.guardians.single().memberNumber)
    }

    @Test
    fun `guardian input maps nullable member number and legal guardian fields`() {
        val serviceInput =
            GuardianInput(
                name = "Teresa",
                role = GuardianRole.LEGAL_GUARDIAN,
                kinship = "Tia",
                email = "teresa@example.test",
                phone = "912000001",
                professionalActivity = null,
                contactPhone = "912000002",
            ).toServiceInput()

        assertEquals("Teresa", serviceInput.name)
        assertEquals(GuardianRole.LEGAL_GUARDIAN, serviceInput.role)
        assertEquals("Tia", serviceInput.kinship)
        assertEquals("912000002", serviceInput.contactPhone)
        assertNull(serviceInput.memberNumber)
    }

    @Test
    fun `athlete update request is a simple partial update carrier`() {
        val request =
            AthleteUpdateRequest(
                jerseyNumber = 8,
                position = "Defesa",
                school = null,
                schoolYear = null,
                schoolClass = null,
                lastClub = null,
                season = "2026/2027",
                hasFamilyInClub = false,
                guardians = emptyList(),
            )

        assertEquals(8, request.jerseyNumber)
        assertEquals("Defesa", request.position)
        assertEquals("2026/2027", request.season)
        assertEquals(emptyList(), request.guardians)
    }
}
