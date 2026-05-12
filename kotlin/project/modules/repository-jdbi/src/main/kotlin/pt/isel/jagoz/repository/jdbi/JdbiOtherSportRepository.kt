package pt.isel.jagoz.repository.jdbi

import org.jdbi.v3.core.Handle
import pt.isel.jagoz.domain.sponsor.OtherSport
import pt.isel.jagoz.repository.OtherSportRepository

class JdbiOtherSportRepository(private val handle: Handle) : OtherSportRepository {
    override fun findAll(): List<OtherSport> {
        return handle.createQuery(
            """
        SELECT *
        FROM jagoz.other_sport
        ORDER BY sort_order ASC
        """,
        )
            .mapTo(OtherSport::class.java)
            .list()
    }

    override fun findActive(): List<OtherSport> {
        return handle.createQuery(
            """
        SELECT *
        FROM jagoz.other_sport
        WHERE active = true
        ORDER BY sort_order ASC
        """,
        )
            .mapTo(OtherSport::class.java)
            .list()
    }

    override fun findById(id: Long): OtherSport? {
        return handle.createQuery(
            """
        SELECT *
        FROM jagoz.other_sport
        WHERE sport_id = :id
        """,
        )
            .bind("id", id)
            .mapTo(OtherSport::class.java)
            .findOne()
            .orElse(null)
    }

    override fun save(os: OtherSport): Long {
        return handle.createUpdate(
            """
        INSERT INTO jagoz.other_sport (code, label, active, price, sort_order)
        VALUES (:code, :label, :active, :price, :sortOrder)
        """,
        )
            .bind("code", os.code)
            .bind("label", os.label)
            .bind("active", os.active)
            .bind("price", os.price)
            .bind("sortOrder", os.sortOrder)
            .executeAndReturnGeneratedKeys()
            .mapTo(Long::class.java)
            .one()
    }

    override fun update(os: OtherSport) {
        handle.createUpdate(
            """
        UPDATE jagoz.other_sport SET
            code = :code,
            label = :label,
            active = :active,
            price = :price,
            sort_order = :sortOrder
        WHERE sport_id = :id
        """,
        )
            .bind("id", os.sportId)
            .bind("code", os.code)
            .bind("label", os.label)
            .bind("active", os.active)
            .bind("price", os.price)
            .bind("sortOrder", os.sortOrder)
            .execute()
    }

    override fun deactivate(id: Long) {
        handle.createUpdate(
            """
        UPDATE jagoz.other_sport
        SET active = false
        WHERE sport_id = :id
        """,
        )
            .bind("id", id)
            .execute()
    }
}
