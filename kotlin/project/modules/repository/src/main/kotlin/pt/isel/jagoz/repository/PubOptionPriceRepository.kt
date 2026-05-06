package pt.isel.jagoz.repository

import pt.isel.jagoz.domain.sponsor.PubOptionPrice

interface PubOptionPriceRepository {
    fun findAll(): List<PubOptionPrice>

    fun findByPubOptionId(pubOptionId: Long): PubOptionPrice?

    fun upsert(price: PubOptionPrice)
}
