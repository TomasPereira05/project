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

    override fun findAll(): List<Sponsor> {
        return handle.createQuery("SELECT * FROM jagoz.sponsor ORDER BY name ASC")
            .mapTo(Sponsor::class.java)
            .list()
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
        nif: String
    ) {
        TODO("Not yet implemented")
    }

    override fun deleteById(id: Long) {
        TODO("Not yet implemented")
    }

    override fun existsById(id: Long): Boolean {
        TODO("Not yet implemented")
    }

    override fun existsByNif(nif: String): Boolean {
        TODO("Not yet implemented")
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
