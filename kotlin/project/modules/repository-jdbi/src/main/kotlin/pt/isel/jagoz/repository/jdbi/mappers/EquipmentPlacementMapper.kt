package pt.isel.jagoz.repository.jdbi.mappers

import org.jdbi.v3.core.mapper.RowMapper
import org.jdbi.v3.core.statement.StatementContext
import pt.isel.jagoz.domain.sponsor.EquipmentPlacement
import java.sql.ResultSet

class EquipmentPlacementMapper : RowMapper<EquipmentPlacement> {
    override fun map(rs: ResultSet, ctx: StatementContext): EquipmentPlacement =
        EquipmentPlacement(
            equipmentId = rs.getLong("placement_id"),
            code = rs.getString("code"),
            label = rs.getString("label"),
            active = rs.getBoolean("active"),
            sortOrder = rs.getInt("sort_order"),
        )
}