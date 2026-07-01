package pt.isel.jagoz.http.model.season

import kotlinx.datetime.LocalDate
import pt.isel.jagoz.domain.season.Season

data class SeasonInput(
    val seasonId: Long = 0,
    val name: String,
    val startsAt: String,
    val endsAt: String,
    val active: Boolean = false,
)

data class SeasonOutput(
    val seasonId: Long,
    val name: String,
    val startsAt: String,
    val endsAt: String,
    val active: Boolean,
)

fun SeasonInput.toDomain(id: Long = seasonId): Season =
    Season(
        seasonId = id,
        name = name,
        startsAt = LocalDate.parse(startsAt),
        endsAt = LocalDate.parse(endsAt),
        active = active,
    )

fun Season.toOutput(): SeasonOutput =
    SeasonOutput(
        seasonId = seasonId,
        name = name,
        startsAt = startsAt.toString(),
        endsAt = endsAt.toString(),
        active = active,
    )
