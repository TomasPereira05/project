package pt.isel.jagoz.domain.event

data class EventSector(
    val sectorId: Long,
    val eventId: Long,
    // "Equipa da Casa" | "Visitante"
    val name: String,
    val capacity: Int,
    val occupied: Int = 0,
) {
    val available: Int get() = capacity - occupied
}