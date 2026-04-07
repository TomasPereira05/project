package pt.isel.member

import pt.isel.sponsor.EquipmentPlacement
import pt.isel.sponsor.PubOption
import pt.isel.sponsor.Sponsor
import pt.isel.sponsor.SponsorDomain
import pt.isel.sponsor.SponsorType
import pt.isel.sponsor.Sponsorship
import pt.isel.sponsor.SponsorshipStatus
import pt.isel.sponsor.TeamCategory
import pt.isel.utils.Either
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class SponsorDomainTests {

    private fun sampleSponsor() = Sponsor(
        sponsorId = 1,
        name = "Acme",
        email = "acme@example.com",
        phone = "912345678",
        nif = "123456789"
    )

    private fun samplePubSponsorship() = Sponsorship(
        sponsorshipId = 1,
        sponsorId = 1,
        season = "2025/2026",
        status = SponsorshipStatus.SUBMETIDO,
        type = SponsorType.PUB,
        price = 1000.0,
        pubOption = PubOption.LONA_3X0_8
    )

    private fun sampleTeamSponsorship() = Sponsorship(
        sponsorshipId = 2,
        sponsorId = 1,
        season = "2025/2026",
        status = SponsorshipStatus.SUBMETIDO,
        type = SponsorType.TEAM,
        price = 2000.0,
        teamCategory = TeamCategory.JUNIORES,
        placement = EquipmentPlacement.FRENTE
    )

    @Test
    fun updateContact_valid_and_invalid() {
        val s = sampleSponsor()
        val ok = SponsorDomain.updateContact(s, "New Name", "new@example.com", "911111111", "987654321")
        assertTrue(ok is Either.Right)
        assertEquals("New Name", ok.value.name)

        val bad = SponsorDomain.updateContact(s, "", "bad", "", "")
        assertTrue(bad is Either.Left)
    }

    @Test
    fun sponsorship_lifecycle_happy_path() {
        val pub = samplePubSponsorship()
        val approved = SponsorDomain.approve(pub)
        assertTrue(approved is Either.Right)
        val paid = SponsorDomain.markPaid((approved ).value)
        assertTrue(paid is Either.Right)
        val activated = SponsorDomain.activate((paid ).value)
        assertTrue(activated is Either.Right)
        assertTrue(SponsorDomain.isActive((activated).value))
    }

    @Test
    fun sponsorship_invalid_transitions_and_cancel() {
        val pub = samplePubSponsorship()
        val failActivate = SponsorDomain.activate(pub)
        assertTrue(failActivate is Either.Left)

        val cancelled = SponsorDomain.cancel(pub)
        assertTrue(cancelled is Either.Right)
        val doubleCancel = SponsorDomain.cancel((cancelled ).value)
        assertTrue(doubleCancel is Either.Left)
    }

    @Test
    fun changePlacement_only_for_team() {
        val pub = samplePubSponsorship()
        val fail = SponsorDomain.changePlacement(pub, EquipmentPlacement.COSTAS)
        assertTrue(fail is Either.Left)

        val team = sampleTeamSponsorship()
        val ok = SponsorDomain.changePlacement(team, EquipmentPlacement.COSTAS)
        assertTrue(ok is Either.Right)
        assertEquals(EquipmentPlacement.COSTAS, (ok).value.placement)
    }

    @Test
    fun validateForCreation_checks() {
        val pub = samplePubSponsorship()
        val ok = SponsorDomain.validateForCreation(pub)
        assertTrue(ok is Either.Right)

        val badPrice = pub.copy(price = -1.0)
        val r1 = SponsorDomain.validateForCreation(badPrice)
        assertTrue(r1 is Either.Left)

        val blankSeason = pub.copy(season = "")
        val r2 = SponsorDomain.validateForCreation(blankSeason)
        assertTrue(r2 is Either.Left)
    }
}