package pt.isel.jagoz.domain.sponsor

data class EquipmentPlacement(
    val equipmentId: Long,
    val code: String,
    val label: String,
    val active: Boolean,
    val sortOrder: Int?
)
