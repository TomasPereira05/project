package pt.isel.jagoz.http.model.member

import kotlinx.datetime.LocalDate

data class ReactivationRequest(
    val reactivationDate: LocalDate,
)
