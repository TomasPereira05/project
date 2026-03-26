package pt.isel

data class SponsorshipPackage(
    val sponsorshipPackageId: Long,
    val type: SponsorType,
    val price: Double,
    val pubOption: PubOption? = null,
    val teamCategory: TeamCategory? = null,
    val placement: EquipmentPlacement? = null,
    val sport: OtherSport? = null,
) {
    // perguntar se cada patrocinador pode ter mais do que um patrocinio,
    // se sim, os múltiplos patrocinios estão no mesmo contrato, ou faz-se um contrato
    // por cada patrocinio, podendo assim cancelar um patrocinio sem cancelar os outros.
    // Se for a primeira opção, remover o init
    init {
        when (type) {
            SponsorType.PUB -> require(pubOption != null && teamCategory == null && placement == null && sport == null)
            SponsorType.TEAM -> require(teamCategory != null && placement != null && pubOption == null && sport == null)
            SponsorType.OTHER -> require(sport != null && pubOption == null && teamCategory == null && placement == null)
        }
    }
}
