package pt.isel.jagoz.sponsor

import pt.isel.jagoz.domain.sponsor.EquipmentPlacement
import pt.isel.jagoz.domain.sponsor.PubOption
import pt.isel.jagoz.domain.sponsor.Sponsor
import pt.isel.jagoz.domain.sponsor.SponsorDomain
import pt.isel.jagoz.domain.sponsor.SponsorType
import pt.isel.jagoz.domain.sponsor.Sponsorship
import pt.isel.jagoz.domain.sponsor.SponsorshipStatus
import pt.isel.jagoz.domain.team.TeamCategory
import pt.isel.jagoz.domain.utils.Either
import kotlin.test.Test
import kotlin.test.assertEquals
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

    private fun samplePubSponsorship() =
        Sponsorship(
            sponsorshipId = 1,
            sponsorId = 1,
            season = "2025/2026",
            status = SponsorshipStatus.SUBMETIDO,
            type = SponsorType.PUB,
            price = 100000,
            pubOption = PubOption.LONA_3X0_8,
        )

    private fun sampleTeamSponsorship() =
        Sponsorship(
            sponsorshipId = 2,
            sponsorId = 1,
            season = "2025/2026",
            status = SponsorshipStatus.SUBMETIDO,
            type = SponsorType.TEAM,
            price = 200000,
            teamCategory = TeamCategory.JUNIORES,
            placement = EquipmentPlacement.FRENTE,
        )

    @Test
    fun updateContact_valid_and_invalid() {
        val s = sampleSponsor()
        val ok = domain.updateContact(s, "New Name", "new@example.com", "911111111", "987654321")
        assertTrue(ok is Either.Right)
        assertEquals("New Name", ok.value.name)

        val bad = domain.updateContact(s, "", "bad", "", "")
        assertTrue(bad is Either.Left)
    }

    @Test
    fun sponsorship_lifecycle_happy_path() {
        val pub = samplePubSponsorship()
        val approved = domain.approve(pub)
        assertTrue(approved is Either.Right)
        val paid = domain.markPaid((approved).value)
        assertTrue(paid is Either.Right)
        val activated = domain.activate((paid).value)
        assertTrue(activated is Either.Right)
        assertTrue(domain.isActive((activated).value))
    }

    @Test
    fun sponsorship_invalid_transitions_and_cancel() {
        val pub = samplePubSponsorship()
        val failActivate = domain.activate(pub)
        assertTrue(failActivate is Either.Left)

        val cancelled = domain.cancel(pub)
        assertTrue(cancelled is Either.Right)
        val doubleCancel = domain.cancel((cancelled).value)
        assertTrue(doubleCancel is Either.Left)
    }

    @Test
    fun changePlacement_only_for_team() {
        val pub = samplePubSponsorship()
        val fail = domain.changePlacement(pub, EquipmentPlacement.COSTAS)
        assertTrue(fail is Either.Left)

        val team = sampleTeamSponsorship()
        val ok = domain.changePlacement(team, EquipmentPlacement.COSTAS)
        assertTrue(ok is Either.Right)
        assertEquals(EquipmentPlacement.COSTAS, (ok).value.placement)
    }

    @Test
    fun validateForCreation_checks() {
        val pub = samplePubSponsorship()
        val ok = domain.validateForCreation(pub)
        assertTrue(ok is Either.Right)

        val badPrice = pub.copy(price = -100)
        val r1 = domain.validateForCreation(badPrice)
        assertTrue(r1 is Either.Left)

        val blankSeason = pub.copy(season = "")
        val r2 = domain.validateForCreation(blankSeason)
        assertTrue(r2 is Either.Left)
    }
}
