package pt.isel.jagoz.repository.jdbi

import org.jdbi.v3.core.Handle
import pt.isel.jagoz.repository.jdbi.mappers.SponsorMapper
import pt.isel.jagoz.repository.SponsorRepository
import pt.isel.jagoz.sponsor.Sponsor

class JdbiSponsorRepository(private val handle: Handle) : SponsorRepository {
    override fun findById(id: Long): Sponsor? {
        return handle.createQuery("SELECT * FROM sponsor WHERE sponsor_id = :id")
            .bind("id", id)
            .mapTo(Sponsor::class.java)
            .findOne()
            .orElse(null)
    }

    override fun findByNif(nif: String): Sponsor? {
        return handle.createQuery("SELECT * FROM sponsor WHERE nif = :nif")
            .bind("nif", nif)
            .mapTo(Sponsor::class.java)
            .findOne()
            .orElse(null)
    }

    override fun findAll(): List<Sponsor> {
        return handle.createQuery("SELECT * FROM sponsor ORDER BY name ASC")
            .mapTo(Sponsor::class.java)
            .list()
    }

    override fun save(sponsor: Sponsor): Long {
        return handle.createUpdate(
            """
            INSERT INTO sponsor (name, email, phone, nif)
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

    override fun update(sponsor: Sponsor) {
        handle.createUpdate(
            """
            UPDATE sponsor SET 
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
