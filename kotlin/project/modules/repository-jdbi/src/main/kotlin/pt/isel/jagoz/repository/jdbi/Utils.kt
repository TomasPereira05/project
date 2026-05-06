package pt.isel.jagoz.repository.jdbi

import kotlinx.datetime.Instant
import org.jdbi.v3.core.Jdbi
import org.jdbi.v3.core.kotlin.KotlinPlugin
import org.jdbi.v3.postgres.PostgresPlugin
import pt.isel.jagoz.domain.athlete.Athlete
import pt.isel.jagoz.domain.event.Event
import pt.isel.jagoz.domain.event.Ticket
import pt.isel.jagoz.domain.member.Member
import pt.isel.jagoz.domain.payment.Charge
import pt.isel.jagoz.domain.payment.Payment
import pt.isel.jagoz.domain.sponsor.Sponsor
import pt.isel.jagoz.domain.sponsor.Sponsorship
import pt.isel.jagoz.domain.user.Token
import pt.isel.jagoz.domain.user.User
import pt.isel.jagoz.domain.sponsor.EquipmentPlacement
import pt.isel.jagoz.domain.sponsor.OtherSport
import pt.isel.jagoz.domain.sponsor.PubOption
import pt.isel.jagoz.domain.sponsor.TeamCategory
import pt.isel.jagoz.repository.jdbi.mappers.AthleteMapper
import pt.isel.jagoz.repository.jdbi.mappers.ChargeMapper
import pt.isel.jagoz.repository.jdbi.mappers.EquipmentPlacementMapper
import pt.isel.jagoz.repository.jdbi.mappers.EventMapper
import pt.isel.jagoz.repository.jdbi.mappers.InstantArgumentFactory
import pt.isel.jagoz.repository.jdbi.mappers.InstantMapper
import pt.isel.jagoz.repository.jdbi.mappers.LocalDateArgumentFactory
import pt.isel.jagoz.repository.jdbi.mappers.MemberMapper
import pt.isel.jagoz.repository.jdbi.mappers.OtherSportMapper
import pt.isel.jagoz.repository.jdbi.mappers.PaymentMapper
import pt.isel.jagoz.repository.jdbi.mappers.PubOptionMapper
import pt.isel.jagoz.repository.jdbi.mappers.SponsorMapper
import pt.isel.jagoz.repository.jdbi.mappers.SponsorshipMapper
import pt.isel.jagoz.repository.jdbi.mappers.TeamCategoryMapper
import pt.isel.jagoz.repository.jdbi.mappers.TicketMapper
import pt.isel.jagoz.repository.jdbi.mappers.TokenMapper
import pt.isel.jagoz.repository.jdbi.mappers.UserMapper

fun Jdbi.configureWithAppRequirements(): Jdbi {
    installPlugin(KotlinPlugin())
    installPlugin(PostgresPlugin())

    registerColumnMapper(Instant::class.java, InstantMapper())

    registerArgument(InstantArgumentFactory())
    registerArgument(LocalDateArgumentFactory())

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
    registerRowMapper(EquipmentPlacement::class.java, EquipmentPlacementMapper())
    registerRowMapper(OtherSport::class.java, OtherSportMapper())
    registerRowMapper(TeamCategory::class.java, TeamCategoryMapper())
    registerRowMapper(PubOption::class.java, PubOptionMapper())

    return this
}
