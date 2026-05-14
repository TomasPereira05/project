package pt.isel.jagoz.repository.jdbi

import org.jdbi.v3.core.Handle
import pt.isel.jagoz.domain.sponsor.EquipmentPlacement
import pt.isel.jagoz.repository.EquipmentPlacementRepository

class JdbiEquipmentPlacementRepository(
    private val handle: Handle,
) : EquipmentPlacementRepository {
    override fun findAll(): List<EquipmentPlacement> =
        handle
            .createQuery(
                """
        SELECT *
        FROM jagoz.equipment_placement
        ORDER BY sort_order ASC NULLS LAST
        """,
            ).mapTo(EquipmentPlacement::class.java)
            .list()

    override fun findActive(): List<EquipmentPlacement> =
        handle
            .createQuery(
                """
            SELECT *
            FROM jagoz.equipment_placement
            WHERE active = true
            ORDER BY placement_id
            """,
            ).mapTo(EquipmentPlacement::class.java)
            .list()

    override fun findById(id: Long): EquipmentPlacement? =
        handle
            .createQuery(
                """
            SELECT *
            FROM jagoz.equipment_placement
            WHERE placement_id = :id
            """,
            ).bind("id", id)
            .mapTo(EquipmentPlacement::class.java)
            .findOne()
            .orElse(null)

    override fun save(ep: EquipmentPlacement): Long =
        handle
            .createUpdate(
                """
        INSERT INTO jagoz.equipment_placement (code, label, active, sort_order)
        VALUES (:code, :label, :active, :sortOrder)
        """,
            ).bind("code", ep.code)
            .bind("label", ep.label)
            .bind("active", ep.active)
            .bind("sortOrder", ep.sortOrder)
            .executeAndReturnGeneratedKeys()
            .mapTo(Long::class.java)
            .one()

    override fun update(ep: EquipmentPlacement) {
        handle
            .createUpdate(
                """
        UPDATE jagoz.equipment_placement
        SET code = :code,
            label = :label,
            active = :active,
            sort_order = :sortOrder
        WHERE placement_id = :id
        """,
            ).bind("id", ep.equipmentId)
            .bind("code", ep.code)
            .bind("label", ep.label)
            .bind("active", ep.active)
            .bind("sortOrder", ep.sortOrder)
            .execute()
    }

    override fun deactivate(id: Long) {
        handle
            .createUpdate(
                """
        UPDATE jagoz.equipment_placement
        SET active = false
        WHERE placement_id = :id
        """,
            ).bind("id", id)
            .execute()
    }
}
