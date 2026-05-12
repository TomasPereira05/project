package pt.isel.jagoz.domain.sponsor

data class PubOption(
    val pubId: Long,
    val code: String,
    val label: String,
    val active: Boolean,
    val available: Int,
    val free: Int,
    val occupied: Int,
    val price: Int,
    val sortOrder: Int?,
)
