package pt.isel.jagoz.http.model.member

import pt.isel.jagoz.domain.member.MemberCategory

data class CategoryRequest(
    val category: MemberCategory,
)
