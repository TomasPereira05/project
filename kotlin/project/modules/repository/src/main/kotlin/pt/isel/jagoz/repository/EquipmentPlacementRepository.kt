package pt.isel.jagoz.repository

import pt.isel.jagoz.domain.sponsor.EquipmentPlacement

interface EquipmentPlacementRepository {
    fun findAll(): List<EquipmentPlacement>
    fun findActive(): List<EquipmentPlacement>
    fun findById(id: Long): EquipmentPlacement?

    fun save(ep: EquipmentPlacement): Long
    fun update(ep: EquipmentPlacement)
    fun deactivate(id: Long)
}