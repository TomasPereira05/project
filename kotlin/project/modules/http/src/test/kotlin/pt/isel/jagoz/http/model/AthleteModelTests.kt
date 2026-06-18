package pt.isel.jagoz.http.model

import kotlinx.datetime.LocalDate
import pt.isel.jagoz.domain.athlete.Athlete
import pt.isel.jagoz.domain.athlete.Guardian
import pt.isel.jagoz.domain.athlete.GuardianRole
import pt.isel.jagoz.domain.member.Member
import pt.isel.jagoz.domain.member.MemberCategory
import pt.isel.jagoz.domain.member.MemberStatus
import pt.isel.jagoz.domain.team.TeamCategory
import pt.isel.jagoz.http.model.athlete.AthleteCreationInputDto
import pt.isel.jagoz.http.model.athlete.AthleteUpdateRequest
import pt.isel.jagoz.http.model.athlete.GuardianInputDto
import pt.isel.jagoz.http.model.athlete.toAdminDto
import pt.isel.jagoz.http.model.athlete.toDetailDto
import pt.isel.jagoz.http.model.athlete.toPublicDto
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
    fun `public dto calculates age after birthday and hides sensitive fields`() {
        val dto = athlete().toPublicDto(member(), LocalDate.parse("2026-05-18"))

        assertEquals(5, dto.id)
        assertEquals("Tiago Rocha", dto.nome)
        assertEquals(16, dto.idade)
        assertEquals("JUNIORES", dto.teamCategoryCode)
        assertEquals("Juniores", dto.teamCategoryLabel)
        assertEquals(10, dto.numero)
        assertEquals("Medio", dto.posicao)
    }

    @Test
    fun `detail dto calculates age before birthday and keeps current season list`() {
        val dto = athlete().toDetailDto(member(), LocalDate.parse("2026-05-17"))

        assertEquals(15, dto.idade)
        assertEquals(listOf("2025/2026"), dto.epocasRepresentadas)
        assertEquals("/api/files/1/public-athlete-photo", dto.fotoUrl)
    }

    @Test
    fun `admin dto derives status from member status and athlete active flag`() {
        assertEquals("ATIVO", athlete(active = true).toAdminDto(member(MemberStatus.ATIVO)).status)
        assertEquals("INATIVO", athlete(active = false).toAdminDto(member(MemberStatus.ATIVO)).status)
        assertEquals("PENDENTE", athlete(active = true).toAdminDto(member(MemberStatus.PENDENTE)).status)
        assertEquals("REJEITADO", athlete(active = true).toAdminDto(member(MemberStatus.REJEITADO)).status)
        assertEquals("INATIVO", athlete(active = true).toAdminDto(member(MemberStatus.INATIVO)).status)
    }

    @Test
    fun `admin dto includes complete sensitive athlete and guardian fields`() {
        val dto = athlete().toAdminDto(member())

        assertEquals("11122233301", dto.niss)
        assertEquals("300003001", dto.numeroUtente)
        assertEquals("CC30001", dto.bi)
        assertEquals("2030-05-01", dto.biExpirationDate)
        assertTrue(dto.hasFamilyInClub)
        assertTrue(dto.schoolCertificationAccepted)
        assertEquals(1, dto.guardians.size)
        assertEquals("Pai", dto.guardians.single().name)
        assertEquals("pai@example.test", dto.guardians.single().email)
    }

    @Test
    fun `creation dto maps to service registration input with parsed dates and guardians`() {
        val input =
            AthleteCreationInputDto(
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
                        GuardianInputDto(
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
            GuardianInputDto(
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
