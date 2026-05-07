package pt.isel.jagoz.domain.sponsor

data class PubOption(
    val pubId: Long,
    val code: String,
    val label: String,
    val active: Boolean,
    val sortOrder: Int?,
)
