package pt.isel.jagoz.repository.jdbi.mappers

import org.jdbi.v3.core.mapper.RowMapper
import org.jdbi.v3.core.statement.StatementContext
import pt.isel.jagoz.domain.athlete.Guardian
import pt.isel.jagoz.domain.athlete.GuardianRole
import java.sql.ResultSet

class GuardianMapper : RowMapper<Guardian> {
    override fun map(
        rs: ResultSet,
        ctx: StatementContext,
    ): Guardian =
        Guardian(
            guardianId = rs.getLong("guardian_id"),
            athleteId = rs.getLong("athlete_id"),
            memberId = (rs.getObject("member_id") as? Number)?.toLong(),
            name = rs.getString("name"),
            role = GuardianRole.valueOf(rs.getString("role")),
            kinship = rs.getString("kinship"),
            email = rs.getString("email"),
            phone = rs.getString("phone"),
            professionalActivity = rs.getString("professional_activity"),
            contactPhone = rs.getString("contact_phone"),
        )
}
