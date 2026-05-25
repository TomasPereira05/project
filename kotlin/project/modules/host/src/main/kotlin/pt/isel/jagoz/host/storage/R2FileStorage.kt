package pt.isel.jagoz.host.storage

import pt.isel.jagoz.service.files.FileObject
import pt.isel.jagoz.service.files.FileStorage
import software.amazon.awssdk.core.sync.RequestBody
import software.amazon.awssdk.services.s3.S3Client
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest
import software.amazon.awssdk.services.s3.model.GetObjectRequest
import software.amazon.awssdk.services.s3.model.PutObjectRequest

class R2FileStorage(
    private val s3: S3Client,
    private val bucket: String,
) : FileStorage {
    override fun put(
        key: String,
        bytes: ByteArray,
        contentType: String,
    ) {
        s3.putObject(
            PutObjectRequest
                .builder()
                .bucket(bucket)
                .key(key)
                .contentType(contentType)
                .contentLength(bytes.size.toLong())
                .build(),
            RequestBody.fromBytes(bytes),
        )
    }

    override fun get(key: String): FileObject {
        val response =
            s3.getObject(
                GetObjectRequest
                    .builder()
                    .bucket(bucket)
                    .key(key)
                    .build(),
            )
        return response.use {
            FileObject(
                bytes = it.readAllBytes(),
                contentType = it.response().contentType(),
            )
        }
    }

    override fun delete(key: String) {
        s3.deleteObject(
            DeleteObjectRequest
                .builder()
                .bucket(bucket)
                .key(key)
                .build(),
        )
    }
}
