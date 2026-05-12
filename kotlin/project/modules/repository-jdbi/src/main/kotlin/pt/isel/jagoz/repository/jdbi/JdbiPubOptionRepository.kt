package pt.isel.jagoz.repository.jdbi

import org.jdbi.v3.core.Handle
import pt.isel.jagoz.domain.sponsor.PubOption
import pt.isel.jagoz.repository.PubOptionRepository

class JdbiPubOptionRepository(private val handle: Handle) : PubOptionRepository {
    override fun findAll(): List<PubOption> {
        return handle.createQuery(
            """
        SELECT *
        FROM jagoz.pub_option
        ORDER BY sort_order ASC
        """,
        )
            .mapTo(PubOption::class.java)
            .list()
    }

    override fun findActive(): List<PubOption> {
        return handle.createQuery(
            """
        SELECT *
        FROM jagoz.pub_option
        WHERE active = true
        ORDER BY sort_order ASC
        """,
        )
            .mapTo(PubOption::class.java)
            .list()
    }

    override fun findById(id: Long): PubOption? {
        return handle.createQuery(
            """
        SELECT *
        FROM jagoz.pub_option
        WHERE pub_option_id = :id
        """,
        )
            .bind("id", id)
            .mapTo(PubOption::class.java)
            .findOne()
            .orElse(null)
    }

    override fun save(po: PubOption): Long {
        return handle.createUpdate(
            """
        INSERT INTO jagoz.pub_option (code, label, active, available, free, occupied, price, sort_order)
        VALUES (:code, :label, :active, :available, :free, :occupied, :price, :sortOrder)
        """,
        )
            .bind("code", po.code)
            .bind("label", po.label)
            .bind("active", po.active)
            .bind("available", po.available)
            .bind("free", po.free)
            .bind("occupied", po.occupied)
            .bind("price", po.price)
            .bind("sortOrder", po.sortOrder)
            .executeAndReturnGeneratedKeys()
            .mapTo(Long::class.java)
            .one()
    }

    override fun update(po: PubOption) {
        handle.createUpdate(
            """
        UPDATE jagoz.pub_option SET
            code = :code,
            label = :label,
            active = :active,
            available = :available,
            free = :free,
            occupied = :occupied,
            price = :price,
            sort_order = :sortOrder
        WHERE pub_option_id = :id
        """,
        )
            .bind("id", po.pubId)
            .bind("code", po.code)
            .bind("label", po.label)
            .bind("active", po.active)
            .bind("available", po.available)
            .bind("free", po.free)
            .bind("occupied", po.occupied)
            .bind("price", po.price)
            .bind("sortOrder", po.sortOrder)
            .execute()
    }

    override fun deactivate(id: Long) {
        handle.createUpdate(
            """
        UPDATE jagoz.pub_option
        SET active = false
        WHERE pub_option_id = :id
        """,
        )
            .bind("id", id)
            .execute()
    }

    override fun reserve(id: Long): Boolean {
        return handle.createUpdate(
            """
        UPDATE jagoz.pub_option
        SET free = free - 1,
            occupied = occupied + 1
        WHERE pub_option_id = :id
          AND active = true
          AND free > 0
        """,
        )
            .bind("id", id)
            .execute() == 1
    }

    override fun release(id: Long) {
        handle.createUpdate(
            """
        UPDATE jagoz.pub_option
        SET free = free + 1,
            occupied = occupied - 1
        WHERE pub_option_id = :id
          AND occupied > 0
          AND free < available
        """,
        )
            .bind("id", id)
            .execute()
    }
}
