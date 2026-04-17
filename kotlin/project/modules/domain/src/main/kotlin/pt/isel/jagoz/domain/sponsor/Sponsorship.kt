package pt.isel.jagoz.domain.sponsor

/**
 * Representa um contrato de patrocÃ­nio individual.
 * Cada tipo de patrocÃ­nio diferente gera um contrato separado.
 * Ex: "MegaSponse" patrocina uma equipa E tem uma lona = 2 Sponsorship's.
 */
data class Sponsorship(
    val sponsorshipId: Long,
    // FK â†’ Sponsor
    val sponsorId: Long,
    // Ã‰poca (ex: "2025/2026")
    val season: String,
    val status: SponsorshipStatus,
    // PUB, TEAM, ou OTHER
    val type: SponsorType,
    // PreÃ§o em cÃªntimos (ex: 50000 = 500.00â‚¬)
    val price: Int,
    // SÃ³ Ã© preenchida 1 das 3 propriedades, conforme o tipo de contrato
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
