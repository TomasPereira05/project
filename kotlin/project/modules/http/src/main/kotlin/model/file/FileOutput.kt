package pt.isel.jagoz.http.model.file

import pt.isel.jagoz.domain.file.FileKind
import pt.isel.jagoz.domain.file.FileOwnerType
import pt.isel.jagoz.domain.file.StoredFile

data class FileOutput(
    val fileId: Long,
    val ownerType: FileOwnerType,
    val ownerId: Long,
    val kind: FileKind,
    val originalName: String,
    val contentType: String,
    val size: Long,
    val uploadedAt: String,
    val uploadedBy: Long,
)

fun StoredFile.toOutput() =
    FileOutput(
        fileId = fileId,
        ownerType = ownerType,
        ownerId = ownerId,
        kind = kind,
        originalName = originalName,
        contentType = contentType,
        size = size,
        uploadedAt = uploadedAt.toString(),
        uploadedBy = uploadedBy,
    )
