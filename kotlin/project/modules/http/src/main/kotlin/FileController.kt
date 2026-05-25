package pt.isel.jagoz.http

import org.springframework.http.ContentDisposition
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.multipart.MultipartFile
import pt.isel.jagoz.domain.file.FileKind
import pt.isel.jagoz.domain.file.FileOwnerType
import pt.isel.jagoz.domain.user.AuthenticatedUser
import pt.isel.jagoz.domain.utils.handle
import pt.isel.jagoz.http.model.file.toOutput
import pt.isel.jagoz.http.utils.Problem
import pt.isel.jagoz.http.utils.Uris
import pt.isel.jagoz.service.files.FileError
import pt.isel.jagoz.service.files.FileObject
import pt.isel.jagoz.service.files.FileService
import pt.isel.jagoz.service.files.FileUploadInput

@RestController
class FileController(
    private val fileService: FileService,
) {
    @GetMapping(Uris.Files.LIST)
    fun listFiles(
        user: AuthenticatedUser,
        @RequestParam ownerType: FileOwnerType,
        @RequestParam ownerId: Long,
        @RequestParam(required = false) kind: FileKind?,
    ): ResponseEntity<*> =
        fileService.list(user, ownerType, ownerId, kind).handle(
            onFailure = { it.toProblem() },
            onSuccess = { files -> ResponseEntity.ok(files.map { it.toOutput() }) },
        )

    @PostMapping(Uris.Files.UPLOAD, consumes = [MediaType.MULTIPART_FORM_DATA_VALUE])
    fun uploadFile(
        user: AuthenticatedUser,
        @RequestParam ownerType: FileOwnerType,
        @RequestParam ownerId: Long,
        @RequestParam kind: FileKind,
        @RequestParam file: MultipartFile,
    ): ResponseEntity<*> =
        fileService
            .upload(
                user,
                FileUploadInput(
                    ownerType = ownerType,
                    ownerId = ownerId,
                    kind = kind,
                    originalName = file.originalFilename.orEmpty(),
                    contentType = file.contentType ?: MediaType.APPLICATION_OCTET_STREAM_VALUE,
                    bytes = file.bytes,
                ),
            ).handle(
                onFailure = { it.toProblem() },
                onSuccess = { stored -> ResponseEntity.status(HttpStatus.CREATED).body(stored.toOutput()) },
            )

    @GetMapping(Uris.Files.CONTENT)
    fun getContent(
        user: AuthenticatedUser,
        @PathVariable fileId: Long,
    ): ResponseEntity<*> =
        fileService.getContent(user, fileId).handle(
            onFailure = { it.toProblem() },
            onSuccess = { (file, obj) -> fileContentResponse(file.originalName, obj) },
        )

    @GetMapping(Uris.Files.PUBLIC_ATHLETE_PHOTO)
    fun getPublicAthletePhoto(
        @PathVariable fileId: Long,
    ): ResponseEntity<*> =
        fileService.getPublicAthletePhoto(fileId).handle(
            onFailure = { it.toProblem() },
            onSuccess = { (file, obj) -> fileContentResponse(file.originalName, obj) },
        )

    @DeleteMapping(Uris.Files.DELETE)
    fun deleteFile(
        user: AuthenticatedUser,
        @PathVariable fileId: Long,
    ): ResponseEntity<*> =
        fileService.delete(user, fileId).handle(
            onFailure = { it.toProblem() },
            onSuccess = { ResponseEntity.noContent().build<Unit>() },
        )

    private fun fileContentResponse(
        fileName: String,
        obj: FileObject,
    ): ResponseEntity<ByteArray> =
        ResponseEntity
            .ok()
            .header(
                HttpHeaders.CONTENT_DISPOSITION,
                ContentDisposition
                    .inline()
                    .filename(fileName)
                    .build()
                    .toString(),
            ).contentType(MediaType.parseMediaType(obj.contentType))
            .body(obj.bytes)

    private fun FileError.toProblem(): ResponseEntity<Any> =
        when (this) {
            is FileError.NotFound -> Problem.InvalidOperation("file", "File $fileId not found").response(HttpStatus.NOT_FOUND)
            is FileError.Validation -> Problem.ValidationError(message).response(HttpStatus.BAD_REQUEST)
            is FileError.Unauthorized -> Problem.Unauthorized(message).response(HttpStatus.FORBIDDEN)
        }
}
