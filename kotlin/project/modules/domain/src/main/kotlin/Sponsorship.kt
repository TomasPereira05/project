package pt.isel

/**
 * Representa um contrato de patrocínio individual.
 * Cada tipo de patrocínio diferente gera um contrato separado.
 * Ex: "MegaSponse" patrocina uma equipa E tem uma lona = 2 Sponsorship's.
 */
data class Sponsorship(
    val sponsorshipId: Long,
    val sponsorId: Long,               // FK → Sponsor
    val season: String,                // Época (ex: "2025/2026")
    val status: SponsorshipStatus,
    val type: SponsorType,             // PUB, TEAM, ou OTHER
    val price: Double,
    // Campos específicos por tipo (só um grupo é preenchido conforme o type)
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
