package pt.isel.jagoz.repository

import pt.isel.jagoz.domain.file.FileKind
import pt.isel.jagoz.domain.file.FileOwnerType
import pt.isel.jagoz.domain.file.StoredFile

interface FileRepository {
    fun save(file: StoredFile): Long

    fun findById(fileId: Long): StoredFile?

    fun findByOwner(
        ownerType: FileOwnerType,
        ownerId: Long,
        kind: FileKind?,
    ): List<StoredFile>

    fun delete(fileId: Long)
}
