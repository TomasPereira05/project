package pt.isel.jagoz.repository.jdbi.mappers

import org.jdbi.v3.core.mapper.RowMapper
import org.jdbi.v3.core.statement.StatementContext
import pt.isel.jagoz.domain.payment.ChargeItem
import java.sql.ResultSet

class ChargeItemMapper : RowMapper<ChargeItem> {
    override fun map(
        rs: ResultSet,
        ctx: StatementContext,
    ): ChargeItem =
        ChargeItem(
            chargeItemId = rs.getLong("charge_item_id"),
            chargeId = rs.getLong("charge_id"),
            season = rs.getString("season"),
            month = rs.getInt("month"),
            amount = rs.getInt("amount"),
            description = rs.getString("description"),
        )
}
