package pt.isel.jagoz.domain.season

import kotlinx.datetime.LocalDate

data class Season(
    val seasonId: Long,
    val name: String,
    val startsAt: LocalDate,
    val endsAt: LocalDate,
    val active: Boolean,
)

sealed class SeasonError {
    data class DomainError(
        val message: String,
    ) : SeasonError()

    data class ValidationError(
        val message: String,
    ) : SeasonError()
}
