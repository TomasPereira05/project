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
        """
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
        """
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
        """
        )
            .bind("id", id)
            .mapTo(PubOption::class.java)
            .findOne()
            .orElse(null)
    }

    override fun save(po: PubOption): Long {
        return handle.createUpdate(
            """
        INSERT INTO jagoz.pub_option (code, label, active, sort_order)
        VALUES (:code, :label, :active, :sortOrder)
        """
        )
            .bind("code", po.code)
            .bind("label", po.label)
            .bind("active", po.active)
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
            sort_order = :sortOrder
        WHERE pub_option_id = :id
        """
        )
            .bind("id", po.pubId)
            .bind("code", po.code)
            .bind("label", po.label)
            .bind("active", po.active)
            .bind("sortOrder", po.sortOrder)
            .execute()
    }

    override fun deactivate(id: Long) {
        handle.createUpdate(
            """
        UPDATE jagoz.pub_option
        SET active = false
        WHERE pub_option_id = :id
        """
        )
            .bind("id", id)
            .execute()
    }
}