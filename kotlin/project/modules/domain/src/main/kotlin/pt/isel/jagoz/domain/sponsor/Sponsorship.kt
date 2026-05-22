package pt.isel.jagoz.domain.sponsor

/**
 * Representa um contrato de patrocÃ­nio individual.
 * Cada tipo de patrocÃ­nio diferente gera um contrato separado.
 * Ex: "MegaSponse" patrocina uma equipa E tem uma lona = 2 Sponsorship's.
 */
data class Sponsorship(
    val sponsorshipId: Long,
    val sponsorId: Long,
    val season: String,
    val status: SponsorshipStatus,
    val type: SponsorType,
    val price: Int,
    val pubOptionId: Long? = null,
    val teamCategoryId: Long? = null,
    val placementId: Long? = null,
    val sportId: Long? = null,
    val otherDetails: String? = null,
)
