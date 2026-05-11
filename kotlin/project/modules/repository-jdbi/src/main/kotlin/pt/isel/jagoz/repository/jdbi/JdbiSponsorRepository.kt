package pt.isel.jagoz.repository.jdbi

import org.jdbi.v3.core.Handle
import pt.isel.jagoz.domain.sponsor.Sponsor
import pt.isel.jagoz.repository.SponsorRepository

class JdbiSponsorRepository(private val handle: Handle) : SponsorRepository {
    override fun findById(id: Long): Sponsor? {
        return handle.createQuery("SELECT * FROM jagoz.sponsor WHERE sponsor_id = :id")
            .bind("id", id)
            .mapTo(Sponsor::class.java)
            .findOne()
            .orElse(null)
    }

    override fun findByNif(nif: String): Sponsor? {
        return handle.createQuery("SELECT * FROM jagoz.sponsor WHERE nif = :nif")
            .bind("nif", nif)
            .mapTo(Sponsor::class.java)
            .findOne()
            .orElse(null)
    }

    override fun findByEmail(email: String): List<Sponsor> {
        return handle.createQuery("SELECT * FROM jagoz.sponsor WHERE lower(email) = lower(:email) ORDER BY sponsor_id DESC")
            .bind("email", email)
            .mapTo(Sponsor::class.java)
            .list()
    }

    override fun findAll(): List<Sponsor> {
        return handle.createQuery("SELECT * FROM jagoz.sponsor ORDER BY name ASC")
            .mapTo(Sponsor::class.java)
            .list()
    }

    override fun findPage(
        limit: Int,
        offset: Int,
    ): List<Sponsor> {
        return handle.createQuery("SELECT * FROM jagoz.sponsor ORDER BY name ASC LIMIT :limit OFFSET :offset")
            .bind("limit", limit)
            .bind("offset", offset)
            .mapTo(Sponsor::class.java)
            .list()
    }

    override fun countAll(): Long {
        return handle.createQuery("SELECT COUNT(*) FROM jagoz.sponsor")
            .mapTo(Long::class.java)
            .one()
    }

    override fun save(sponsor: Sponsor): Long {
        return handle.createUpdate(
            """
            INSERT INTO jagoz.sponsor (name, email, phone, nif)
            VALUES (:name, :email, :phone, :nif)
            """,
        )
            .bind("name", sponsor.name)
            .bind("email", sponsor.email)
            .bind("phone", sponsor.phone)
            .bind("nif", sponsor.nif)
            .executeAndReturnGeneratedKeys()
            .mapTo(Long::class.java)
            .one()
    }

    override fun updateContact(
        id: Long,
        name: String,
        email: String,
        phone: String,
        nif: String,
    ) {
        handle.createUpdate(
            """
            UPDATE jagoz.sponsor
            SET name = :name,
                email = :email,
                phone = :phone,
                nif = :nif
            WHERE sponsor_id = :id
            """,
        )
            .bind("id", id)
            .bind("name", name)
            .bind("email", email)
            .bind("phone", phone)
            .bind("nif", nif)
            .execute()
    }

    override fun deleteById(id: Long) {
        handle.createUpdate("DELETE FROM jagoz.sponsor WHERE sponsor_id = :id")
            .bind("id", id)
            .execute()
    }

    override fun existsById(id: Long): Boolean {
        return handle.createQuery("SELECT EXISTS (SELECT 1 FROM jagoz.sponsor WHERE sponsor_id = :id)")
            .bind("id", id)
            .mapTo(Boolean::class.java)
            .one()
    }

    override fun existsByNif(nif: String): Boolean {
        return handle.createQuery("SELECT EXISTS (SELECT 1 FROM jagoz.sponsor WHERE nif = :nif)")
            .bind("nif", nif)
            .mapTo(Boolean::class.java)
            .one()
    }

    override fun update(sponsor: Sponsor) {
        handle.createUpdate(
            """
            UPDATE jagoz.sponsor SET 
                name = :name, 
                email = :email, 
                phone = :phone, 
                nif = :nif
            WHERE sponsor_id = :id
            """,
        )
            .bind("id", sponsor.sponsorId)
            .bind("name", sponsor.name)
            .bind("email", sponsor.email)
            .bind("phone", sponsor.phone)
            .bind("nif", sponsor.nif)
            .execute()
    }
}
