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

    val teamPriceId: Long? = null,
    val pubPriceId: Long? = null,
    val sportPriceId: Long? = null,

    val pubOptionId: Long? = null,
    val teamCategoryId: Long? = null,
    val placementId: Long? = null,
    val sportId: Long? = null,
) {
    init {
        when (type) {
            SponsorType.PUB -> require(
                pubOptionId != null &&
                        pubPriceId != null &&
                        teamCategoryId == null &&
                        placementId == null &&
                        sportId == null &&
                        teamPriceId == null &&
                        sportPriceId == null
            )

            SponsorType.TEAM -> require(
                teamCategoryId != null &&
                        placementId != null &&
                        teamPriceId != null &&
                        pubOptionId == null &&
                        sportId == null &&
                        pubPriceId == null &&
                        sportPriceId == null
            )

            SponsorType.OTHER -> require(
                sportId != null &&
                        sportPriceId != null &&
                        pubOptionId == null &&
                        teamCategoryId == null &&
                        placementId == null &&
                        pubPriceId == null &&
                        teamPriceId == null
            )
        }
    }
}
