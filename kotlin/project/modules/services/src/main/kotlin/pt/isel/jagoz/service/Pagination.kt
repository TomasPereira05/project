package pt.isel.jagoz.service

data class Page<T>(
    val items: List<T>,
    val page: Int,
    val size: Int,
    val total: Long,
    val totalPages: Int,
)

data class PageRequest(
    val page: Int,
    val size: Int,
) {
    val offset: Int
        get() = (page - 1) * size
}

fun pageRequest(
    page: Int,
    size: Int,
): PageRequest {
    val normalizedPage = page.coerceAtLeast(1)
    val normalizedSize = size.coerceIn(1, 100)
    return PageRequest(normalizedPage, normalizedSize)
}

fun <T> pageOf(
    items: List<T>,
    request: PageRequest,
    total: Long,
): Page<T> =
    Page(
        items = items,
        page = request.page,
        size = request.size,
        total = total,
        totalPages = maxOf(1, ((total + request.size - 1) / request.size).toInt()),
    )
