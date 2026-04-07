package pt.isel.sponsor

/**
 * Representa um contrato de patrocínio individual.
 * Cada tipo de patrocínio diferente gera um contrato separado.
 * Ex: "MegaSponse" patrocina uma equipa E tem uma lona = 2 Sponsorship's.
 */
data class Sponsorship(
    val sponsorshipId: Long,
    // FK → Sponsor
    val sponsorId: Long,
    // Época (ex: "2025/2026")
    val season: String,
    val status: SponsorshipStatus,
    // PUB, TEAM, ou OTHER
    val type: SponsorType,
    val price: Double,
    // Só é preenchida 1 das 3 propriedades, conforme o tipo de contrato
    val pubOption: PubOption? = null,
    val teamCategory: TeamCategory? = null,
    val placement: EquipmentPlacement? = null,
    val sport: OtherSport? = null,
) {
    init {
        when (type) {
            SponsorType.PUB -> require(pubOption != null && teamCategory == null && placement == null && sport == null)
            SponsorType.TEAM -> require(teamCategory != null && placement != null && pubOption == null && sport == null)
            SponsorType.OTHER -> require(sport != null && pubOption == null && teamCategory == null && placement == null)
        }
    }
}
