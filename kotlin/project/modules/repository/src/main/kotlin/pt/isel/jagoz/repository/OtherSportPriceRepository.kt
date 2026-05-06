package pt.isel.jagoz.repository

import pt.isel.jagoz.domain.sponsor.OtherSportPrice

interface OtherSportPriceRepository {
    fun findAll(): List<OtherSportPrice>

    fun findBySportId(sportId: Long): OtherSportPrice?

    fun upsert(price: OtherSportPrice)
}
