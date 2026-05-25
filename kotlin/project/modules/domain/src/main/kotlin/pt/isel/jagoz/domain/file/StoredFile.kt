package pt.isel.jagoz.domain.file

import kotlinx.datetime.Instant

data class StoredFile(
    val fileId: Long,
    val ownerType: FileOwnerType,
    val ownerId: Long,
    val kind: FileKind,
    val originalName: String,
    val contentType: String,
    val size: Long,
    val storageKey: String,
    val uploadedAt: Instant,
    val uploadedBy: Long,
)
