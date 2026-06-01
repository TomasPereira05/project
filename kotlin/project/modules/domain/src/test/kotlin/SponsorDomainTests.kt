package pt.isel.jagoz.sponsor

import pt.isel.jagoz.domain.sponsor.Sponsor
import pt.isel.jagoz.domain.sponsor.SponsorDomain
import pt.isel.jagoz.domain.sponsor.SponsorError
import pt.isel.jagoz.domain.sponsor.SponsorType
import pt.isel.jagoz.domain.sponsor.Sponsorship
import pt.isel.jagoz.domain.sponsor.SponsorshipStatus
import pt.isel.jagoz.domain.utils.Either
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertIs
import kotlin.test.assertTrue

class SponsorDomainTests {
    private val domain = SponsorDomain()

    private fun sampleSponsor() =
        Sponsor(
            sponsorId = 1,
            name = "Acme",
            email = "acme@example.com",
            phone = "912345678",
            nif = "123456789",
        )

    private fun pubSponsorship(status: SponsorshipStatus = SponsorshipStatus.SUBMETIDO) =
        Sponsorship(
            sponsorshipId = 1,
            sponsorId = 1,
            season = "2025/2026",
            status = status,
            type = SponsorType.PUB,
            price = 100000,
            pubOptionId = 5,
            teamCategoryId = null,
            placementId = null,
            sportId = null,
        )

    private fun teamSponsorship(status: SponsorshipStatus = SponsorshipStatus.SUBMETIDO) =
        Sponsorship(
            sponsorshipId = 2,
            sponsorId = 1,
            season = "2025/2026",
            status = status,
            type = SponsorType.TEAM,
            price = 200000,
            pubOptionId = null,
            teamCategoryId = 7,
            placementId = 3,
            sportId = null,
        )

    private fun otherSponsorship(status: SponsorshipStatus = SponsorshipStatus.SUBMETIDO) =
        Sponsorship(
            sponsorshipId = 3,
            sponsorId = 1,
            season = "2025/2026",
            status = status,
            type = SponsorType.OTHER,
            price = 50000,
            pubOptionId = null,
            teamCategoryId = null,
            placementId = null,
            sportId = 9,
            otherDetails = "Apoio ao torneio de voleibol",
        )

    // ---- approveSponsorship ----

    @Test
    fun `approveSponsorship transitions SUBMETIDO to APROVADO`() {
        val res = domain.approveSponsorship(pubSponsorship())
        assertTrue(res is Either.Right)
        assertEquals(SponsorshipStatus.APROVADO, res.value.status)
    }

    @Test
    fun `approveSponsorship rejects non-SUBMETIDO`() {
        val res = domain.approveSponsorship(pubSponsorship(SponsorshipStatus.APROVADO))
        assertTrue(res is Either.Left)
        val err = assertIs<SponsorError.InvalidTransition>(res.value)
        assertEquals("approve", err.attempted)
    }

    // ---- markPaid ----

    @Test
    fun `markPaid transitions APROVADO to PAGO`() {
        val res = domain.markPaid(pubSponsorship(SponsorshipStatus.APROVADO))
        assertTrue(res is Either.Right)
        assertEquals(SponsorshipStatus.PAGO, res.value.status)
    }

    @Test
    fun `markPaid rejects non-APROVADO`() {
        val res = domain.markPaid(pubSponsorship(SponsorshipStatus.SUBMETIDO))
        assertTrue(res is Either.Left)
        assertIs<SponsorError.InvalidTransition>(res.value)
    }

    // ---- cancelSponsorship ----

    @Test
    fun `cancelSponsorship from SUBMETIDO`() {
        val res = domain.cancelSponsorship(pubSponsorship())
        assertTrue(res is Either.Right)
        assertEquals(SponsorshipStatus.CANCELADO, res.value.status)
    }

    @Test
    fun `cancelSponsorship from APROVADO`() {
        val res = domain.cancelSponsorship(pubSponsorship(SponsorshipStatus.APROVADO))
        assertTrue(res is Either.Right)
        assertEquals(SponsorshipStatus.CANCELADO, res.value.status)
    }

    @Test
    fun `cancelSponsorship rejects already CANCELADO`() {
        val res = domain.cancelSponsorship(pubSponsorship(SponsorshipStatus.CANCELADO))
        assertTrue(res is Either.Left)
        assertIs<SponsorError.DomainError>(res.value)
    }

    // ---- validateForCreation: Sponsor ----

    @Test
    fun `validateForCreation accepts valid sponsor`() {
        val res = domain.validateForCreation(sampleSponsor())
        assertTrue(res is Either.Right)
    }

    @Test
    fun `validateForCreation rejects blank sponsor name`() {
        val res = domain.validateForCreation(sampleSponsor().copy(name = ""))
        assertTrue(res is Either.Left)
        val err = assertIs<SponsorError.ValidationError>(res.value)
        assertTrue(err.message.contains("name"))
    }

    @Test
    fun `validateForCreation rejects invalid sponsor email`() {
        val res = domain.validateForCreation(sampleSponsor().copy(email = "bad"))
        assertTrue(res is Either.Left)
        assertIs<SponsorError.ValidationError>(res.value)
    }

    @Test
    fun `validateForCreation rejects sponsor nif with wrong digits`() {
        val res = domain.validateForCreation(sampleSponsor().copy(nif = "12"))
        assertTrue(res is Either.Left)
        val err = assertIs<SponsorError.ValidationError>(res.value)
        assertTrue(err.message.contains("nif"))
    }

    @Test
    fun `validateForCreation rejects blank sponsor phone`() {
        val res = domain.validateForCreation(sampleSponsor().copy(phone = ""))
        assertTrue(res is Either.Left)
        assertIs<SponsorError.ValidationError>(res.value)
    }

    // ---- validateForCreation: Sponsorship ----

    @Test
    fun `validateForCreation accepts valid PUB sponsorship`() {
        val res = domain.validateForCreation(pubSponsorship())
        assertTrue(res is Either.Right)
    }

    @Test
    fun `validateForCreation accepts valid TEAM sponsorship`() {
        val res = domain.validateForCreation(teamSponsorship())
        assertTrue(res is Either.Right)
    }

    @Test
    fun `validateForCreation accepts valid OTHER sponsorship`() {
        val res = domain.validateForCreation(otherSponsorship())
        assertTrue(res is Either.Right)
    }

    @Test
    fun `validateForCreation rejects negative price`() {
        val res = domain.validateForCreation(pubSponsorship().copy(price = -1))
        assertTrue(res is Either.Left)
        assertIs<SponsorError.ValidationError>(res.value)
    }

    @Test
    fun `validateForCreation rejects blank season`() {
        val res = domain.validateForCreation(pubSponsorship().copy(season = ""))
        assertTrue(res is Either.Left)
        assertIs<SponsorError.ValidationError>(res.value)
    }

    @Test
    fun `validateForCreation rejects PUB without pubOptionId`() {
        val res = domain.validateForCreation(pubSponsorship().copy(pubOptionId = null))
        assertTrue(res is Either.Left)
        val err = assertIs<SponsorError.ValidationError>(res.value)
        assertTrue(err.message.contains("pubOptionId"))
    }

    @Test
    fun `validateForCreation rejects PUB with teamCategoryId`() {
        val res = domain.validateForCreation(pubSponsorship().copy(teamCategoryId = 1))
        assertTrue(res is Either.Left)
        assertIs<SponsorError.ValidationError>(res.value)
    }

    @Test
    fun `validateForCreation rejects TEAM without teamCategoryId`() {
        val res = domain.validateForCreation(teamSponsorship().copy(teamCategoryId = null))
        assertTrue(res is Either.Left)
        assertIs<SponsorError.ValidationError>(res.value)
    }

    @Test
    fun `validateForCreation rejects TEAM without placementId`() {
        val res = domain.validateForCreation(teamSponsorship().copy(placementId = null))
        assertTrue(res is Either.Left)
        assertIs<SponsorError.ValidationError>(res.value)
    }

    @Test
    fun `validateForCreation rejects TEAM with pubOptionId`() {
        val res = domain.validateForCreation(teamSponsorship().copy(pubOptionId = 1))
        assertTrue(res is Either.Left)
        assertIs<SponsorError.ValidationError>(res.value)
    }

    @Test
    fun `validateForCreation rejects OTHER without sportId`() {
        val res = domain.validateForCreation(otherSponsorship().copy(sportId = null))
        assertTrue(res is Either.Left)
        assertIs<SponsorError.ValidationError>(res.value)
    }

    @Test
    fun `validateForCreation rejects OTHER with placementId`() {
        val res = domain.validateForCreation(otherSponsorship().copy(placementId = 1))
        assertTrue(res is Either.Left)
        assertIs<SponsorError.ValidationError>(res.value)
    }

    // ---- updateSponsor ----

    @Test
    fun `updateSponsor applies new values`() {
        val res =
            domain.updateSponsor(
                sampleSponsor(),
                name = "Acme Updated",
                email = "new@example.com",
                phone = "999999999",
                nif = "987654321",
            )
        assertTrue(res is Either.Right)
        assertEquals("Acme Updated", res.value.name)
        assertEquals("new@example.com", res.value.email)
        assertEquals("987654321", res.value.nif)
    }

    @Test
    fun `updateSponsor rejects invalid email`() {
        val res =
            domain.updateSponsor(
                sampleSponsor(),
                name = "Acme",
                email = "no-at-sign",
                phone = "999999999",
                nif = "987654321",
            )
        assertTrue(res is Either.Left)
        assertIs<SponsorError.ValidationError>(res.value)
    }

    @Test
    fun `updateSponsor rejects malformed nif`() {
        val res =
            domain.updateSponsor(
                sampleSponsor(),
                name = "Acme",
                email = "ok@example.com",
                phone = "999999999",
                nif = "abc",
            )
        assertTrue(res is Either.Left)
        assertIs<SponsorError.ValidationError>(res.value)
    }
}
