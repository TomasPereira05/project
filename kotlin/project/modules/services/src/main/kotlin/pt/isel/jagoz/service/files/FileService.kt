package pt.isel.jagoz.service.files

import jakarta.inject.Named
import kotlinx.datetime.Clock
import pt.isel.jagoz.domain.file.FileKind
import pt.isel.jagoz.domain.file.FileOwnerType
import pt.isel.jagoz.domain.file.StoredFile
import pt.isel.jagoz.domain.user.AuthenticatedUser
import pt.isel.jagoz.domain.user.canManageBackoffice
import pt.isel.jagoz.domain.utils.Either
import pt.isel.jagoz.domain.utils.failure
import pt.isel.jagoz.domain.utils.success
import pt.isel.jagoz.repository.Transaction
import pt.isel.jagoz.repository.TransactionManager
import java.util.UUID

data class FileUploadInput(
    val ownerType: FileOwnerType,
    val ownerId: Long,
    val kind: FileKind,
    val originalName: String,
    val contentType: String,
    val bytes: ByteArray,
)

sealed class FileError {
    data class NotFound(
        val fileId: Long,
    ) : FileError()

    data class Validation(
        val message: String,
    ) : FileError()

    data class Unauthorized(
        val message: String,
    ) : FileError()
}

typealias FileResult<T> = Either<FileError, T>

@Named
class FileService(
    private val transactionManager: TransactionManager,
    private val storage: FileStorage,
) {
    fun upload(
        user: AuthenticatedUser,
        input: FileUploadInput,
    ): FileResult<StoredFile> {
        validateOwnerKind(input.ownerType, input.kind)?.let { return failure(it) }
        validateContent(input.kind, input.contentType, input.bytes.size.toLong())?.let { return failure(it) }

        return transactionManager.run { tx ->
            if (!canAccessOwner(tx, user, input.ownerType, input.ownerId)) {
                return@run failure(FileError.Unauthorized("not allowed to upload this file"))
            }

            val previousFiles = tx.fileRepository.findByOwner(input.ownerType, input.ownerId, input.kind)
            val key = buildStorageKey(input)
            val now = Clock.System.now()

            val file =
                StoredFile(
                    fileId = 0,
                    ownerType = input.ownerType,
                    ownerId = input.ownerId,
                    kind = input.kind,
                    originalName = input.originalName.ifBlank { defaultFileName(input.kind, input.contentType) },
                    contentType = input.contentType,
                    size = input.bytes.size.toLong(),
                    storageKey = key,
                    uploadedAt = now,
                    uploadedBy = user.userId,
                )
            val id = tx.fileRepository.save(file)
            storage.put(key, input.bytes, input.contentType)
            if (input.kind == FileKind.ATHLETE_PHOTO) {
                tx.athleteRepository.findById(input.ownerId)?.let { athlete ->
                    tx.athleteRepository.update(athlete.copy(photoUrl = "/api/files/$id/public-athlete-photo"))
                }
            }

            previousFiles.forEach {
                tx.fileRepository.delete(it.fileId)
                storage.delete(it.storageKey)
            }

            success(file.copy(fileId = id))
        }
    }

    fun list(
        user: AuthenticatedUser,
        ownerType: FileOwnerType,
        ownerId: Long,
        kind: FileKind?,
    ): FileResult<List<StoredFile>> =
        transactionManager.run { tx ->
            if (!canAccessOwner(tx, user, ownerType, ownerId)) {
                return@run failure(FileError.Unauthorized("not allowed to list these files"))
            }
            success(tx.fileRepository.findByOwner(ownerType, ownerId, kind))
        }

    fun getContent(
        user: AuthenticatedUser,
        fileId: Long,
    ): FileResult<Pair<StoredFile, FileObject>> =
        transactionManager.run { tx ->
            val file = tx.fileRepository.findById(fileId) ?: return@run failure(FileError.NotFound(fileId))
            if (!canAccessOwner(tx, user, file.ownerType, file.ownerId)) {
                return@run failure(FileError.Unauthorized("not allowed to read this file"))
            }
            success(file to storage.get(file.storageKey))
        }

    fun getPublicAthletePhoto(fileId: Long): FileResult<Pair<StoredFile, FileObject>> =
        transactionManager.run { tx ->
            val file = tx.fileRepository.findById(fileId) ?: return@run failure(FileError.NotFound(fileId))
            if (file.kind != FileKind.ATHLETE_PHOTO) {
                return@run failure(FileError.Unauthorized("file is not public"))
            }
            success(file to storage.get(file.storageKey))
        }

    fun delete(
        user: AuthenticatedUser,
        fileId: Long,
    ): FileResult<Unit> =
        transactionManager.run { tx ->
            val file = tx.fileRepository.findById(fileId) ?: return@run failure(FileError.NotFound(fileId))
            if (!canAccessOwner(tx, user, file.ownerType, file.ownerId)) {
                return@run failure(FileError.Unauthorized("not allowed to delete this file"))
            }
            tx.fileRepository.delete(fileId)
            if (file.kind == FileKind.ATHLETE_PHOTO) {
                tx.athleteRepository.findById(file.ownerId)?.let { athlete ->
                    tx.athleteRepository.update(athlete.copy(photoUrl = null))
                }
            }
            storage.delete(file.storageKey)
            success(Unit)
        }

    private fun validateOwnerKind(
        ownerType: FileOwnerType,
        kind: FileKind,
    ): FileError.Validation? =
        when (kind) {
            FileKind.USER_PROFILE_PHOTO ->
                if (ownerType == FileOwnerType.USER) null else FileError.Validation("user profile photo must belong to a user")
            FileKind.MEMBER_PHOTO ->
                if (ownerType == FileOwnerType.MEMBER) null else FileError.Validation("member photo must belong to a member")
            FileKind.ATHLETE_PHOTO,
            FileKind.ATHLETE_ID_CARD,
            FileKind.ATHLETE_MEDICAL_EXAM,
            ->
                if (ownerType == FileOwnerType.ATHLETE) null else FileError.Validation("athlete files must belong to an athlete")
        }

    private fun validateContent(
        kind: FileKind,
        contentType: String,
        size: Long,
    ): FileError.Validation? {
        val normalizedType = contentType.lowercase()
        val isPhoto = kind in setOf(FileKind.USER_PROFILE_PHOTO, FileKind.MEMBER_PHOTO, FileKind.ATHLETE_PHOTO)
        val allowed =
            if (isPhoto) {
                setOf("image/jpeg", "image/png", "image/webp")
            } else {
                setOf("image/jpeg", "image/png", "image/webp", "application/pdf")
            }
        if (normalizedType !in allowed) {
            return FileError.Validation("unsupported file type")
        }
        val maxSize = if (isPhoto) 5L * 1024L * 1024L else 10L * 1024L * 1024L
        if (size <= 0) return FileError.Validation("file is empty")
        if (size > maxSize) return FileError.Validation("file is too large")
        return null
    }

    private fun canAccessOwner(
        tx: Transaction,
        user: AuthenticatedUser,
        ownerType: FileOwnerType,
        ownerId: Long,
    ): Boolean {
        if (user.canManageBackoffice()) return true
        return when (ownerType) {
            FileOwnerType.USER -> user.userId == ownerId
            FileOwnerType.MEMBER -> {
                val member = tx.memberRepository.findById(ownerId) ?: return false
                member.memberId == user.activeMemberId || member.userId == user.userId
            }
            FileOwnerType.ATHLETE -> {
                val athlete = tx.athleteRepository.findById(ownerId) ?: return false
                val member = tx.memberRepository.findById(athlete.memberId) ?: return false
                member.memberId == user.activeMemberId || member.userId == user.userId
            }
        }
    }

    private fun buildStorageKey(input: FileUploadInput): String =
        "${input.ownerType.name.lowercase()}/${input.ownerId}/${input.kind.name.lowercase()}/${UUID.randomUUID()}-${sanitizeName(input.originalName)}"

    private fun sanitizeName(name: String): String =
        name
            .trim()
            .ifBlank { "file" }
            .replace(Regex("[^A-Za-z0-9._-]"), "_")
            .take(120)

    private fun defaultFileName(
        kind: FileKind,
        contentType: String,
    ): String {
        val extension = if (contentType == "application/pdf") "pdf" else "jpg"
        return "${kind.name.lowercase()}.$extension"
    }
}
