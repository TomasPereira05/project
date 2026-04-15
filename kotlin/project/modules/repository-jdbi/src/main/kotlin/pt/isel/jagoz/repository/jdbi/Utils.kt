package pt.isel.jagoz.repository.jdbi

import org.jdbi.v3.core.Jdbi
import org.jdbi.v3.core.kotlin.KotlinPlugin
import org.jdbi.v3.postgres.PostgresPlugin
import pt.isel.jagoz.athlete.Athlete
import pt.isel.jagoz.event.Event
import pt.isel.jagoz.event.Ticket
import pt.isel.jagoz.member.Member
import pt.isel.jagoz.payment.Charge
import pt.isel.jagoz.payment.Payment
import pt.isel.jagoz.sponsor.Sponsor
import pt.isel.jagoz.sponsor.Sponsorship
import pt.isel.jagoz.user.Token
import pt.isel.jagoz.user.User
import pt.isel.jagoz.repository.jdbi.mappers.AthleteMapper
import pt.isel.jagoz.repository.jdbi.mappers.ChargeMapper
import pt.isel.jagoz.repository.jdbi.mappers.EventMapper
import pt.isel.jagoz.repository.jdbi.mappers.MemberMapper
import pt.isel.jagoz.repository.jdbi.mappers.PaymentMapper
import pt.isel.jagoz.repository.jdbi.mappers.SponsorMapper
import pt.isel.jagoz.repository.jdbi.mappers.SponsorshipMapper
import pt.isel.jagoz.repository.jdbi.mappers.TicketMapper
import pt.isel.jagoz.repository.jdbi.mappers.TokenMapper
import pt.isel.jagoz.repository.jdbi.mappers.UserMapper

fun Jdbi.configureWithAppRequirements(): Jdbi {
    installPlugin(KotlinPlugin())
    installPlugin(PostgresPlugin())

    registerRowMapper(Athlete::class.java, AthleteMapper())
    registerRowMapper(Charge::class.java, ChargeMapper())
    registerRowMapper(Event::class.java, EventMapper())
    registerRowMapper(Member::class.java, MemberMapper())
    registerRowMapper(Payment::class.java, PaymentMapper())
    registerRowMapper(Sponsor::class.java, SponsorMapper())
    registerRowMapper(Sponsorship::class.java, SponsorshipMapper())
    registerRowMapper(Ticket::class.java, TicketMapper())
    registerRowMapper(Token::class.java, TokenMapper())
    registerRowMapper(User::class.java, UserMapper())

    return this
}
