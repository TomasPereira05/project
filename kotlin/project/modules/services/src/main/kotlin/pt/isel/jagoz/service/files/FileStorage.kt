package pt.isel.jagoz.service.files

data class FileObject(
    val bytes: ByteArray,
    val contentType: String,
)

interface FileStorage {
    fun put(
        key: String,
        bytes: ByteArray,
        contentType: String,
    )

    fun get(key: String): FileObject

    fun delete(key: String)
}
