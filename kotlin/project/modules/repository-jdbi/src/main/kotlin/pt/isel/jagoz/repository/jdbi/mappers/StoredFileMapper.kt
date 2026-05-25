package pt.isel.jagoz.repository.jdbi.mappers

import kotlinx.datetime.Instant
import org.jdbi.v3.core.mapper.RowMapper
import org.jdbi.v3.core.statement.StatementContext
import pt.isel.jagoz.domain.file.FileKind
import pt.isel.jagoz.domain.file.FileOwnerType
import pt.isel.jagoz.domain.file.StoredFile
import java.sql.ResultSet

class StoredFileMapper : RowMapper<StoredFile> {
    override fun map(
        rs: ResultSet,
        ctx: StatementContext,
    ): StoredFile =
        StoredFile(
            fileId = rs.getLong("file_id"),
            ownerType = FileOwnerType.valueOf(rs.getString("owner_type")),
            ownerId = rs.getLong("owner_id"),
            kind = FileKind.valueOf(rs.getString("kind")),
            originalName = rs.getString("original_name"),
            contentType = rs.getString("content_type"),
            size = rs.getLong("size"),
            storageKey = rs.getString("storage_key"),
            uploadedAt = Instant.fromEpochMilliseconds(rs.getTimestamp("uploaded_at").time),
            uploadedBy = rs.getLong("uploaded_by"),
        )
}
