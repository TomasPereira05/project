package pt.isel.jagoz.repository.jdbi

import org.jdbi.v3.core.Handle
import pt.isel.jagoz.domain.file.FileKind
import pt.isel.jagoz.domain.file.FileOwnerType
import pt.isel.jagoz.domain.file.StoredFile
import pt.isel.jagoz.repository.FileRepository

class JdbiFileRepository(
    private val handle: Handle,
) : FileRepository {
    override fun save(file: StoredFile): Long =
        handle
            .createUpdate(
                """
                INSERT INTO jagoz.uploaded_file (
                    owner_type, owner_id, kind, original_name, content_type,
                    size, storage_key, uploaded_at, uploaded_by
                ) VALUES (
                    CAST(:ownerType AS jagoz.file_owner_type), :ownerId, CAST(:kind AS jagoz.file_kind),
                    :originalName, :contentType, :size, :storageKey, :uploadedAt, :uploadedBy
                )
                """.trimIndent(),
            ).bind("ownerType", file.ownerType.name)
            .bind("ownerId", file.ownerId)
            .bind("kind", file.kind.name)
            .bind("originalName", file.originalName)
            .bind("contentType", file.contentType)
            .bind("size", file.size)
            .bind("storageKey", file.storageKey)
            .bind("uploadedAt", file.uploadedAt)
            .bind("uploadedBy", file.uploadedBy)
            .executeAndReturnGeneratedKeys()
            .mapTo(Long::class.java)
            .one()

    override fun findById(fileId: Long): StoredFile? =
        handle
            .createQuery("SELECT * FROM jagoz.uploaded_file WHERE file_id = :fileId")
            .bind("fileId", fileId)
            .mapTo(StoredFile::class.java)
            .findOne()
            .orElse(null)

    override fun findByOwner(
        ownerType: FileOwnerType,
        ownerId: Long,
        kind: FileKind?,
    ): List<StoredFile> {
        val kindClause = if (kind == null) "" else " AND kind = CAST(:kind AS jagoz.file_kind)"
        val query =
            handle
                .createQuery(
                    """
                    SELECT * FROM jagoz.uploaded_file
                    WHERE owner_type = CAST(:ownerType AS jagoz.file_owner_type)
                      AND owner_id = :ownerId
                      $kindClause
                    ORDER BY uploaded_at DESC, file_id DESC
                    """.trimIndent(),
                ).bind("ownerType", ownerType.name)
                .bind("ownerId", ownerId)

        if (kind != null) query.bind("kind", kind.name)
        return query.mapTo(StoredFile::class.java).list()
    }

    override fun delete(fileId: Long) {
        handle
            .createUpdate("DELETE FROM jagoz.uploaded_file WHERE file_id = :fileId")
            .bind("fileId", fileId)
            .execute()
    }
}
