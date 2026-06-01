package pt.isel.jagoz.http

import org.springframework.http.HttpStatus
import pt.isel.jagoz.http.utils.Problem
import pt.isel.jagoz.http.utils.Uris
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotNull

class UtilsTests {
    @Test
    fun `uri helpers expand resource ids`() {
        assertEquals("/api", Uris.HOME)
        assertEquals("/api/users/7", Uris.Users.byId(7).toString())
        assertEquals("/api/members/8", Uris.Members.byId(8).toString())
        assertEquals("/api/athletes/9", Uris.Athletes.byId(9).toString())
        assertEquals("/api/events/10", Uris.Events.byId(10).toString())
    }

    @Test
    fun `problem type and title are derived from problem uri`() {
        val problem = Problem.InvalidOperation(operation = "event", reason = "already cancelled")

        assertEquals("/problems/invalid-operation", problem.type)
        assertEquals("invalid-operation", problem.title)
        assertEquals("event", problem.operation)
        assertEquals("already cancelled", problem.reason)
    }

    @Test
    fun `problem response uses application problem json content type and status`() {
        val response = Problem.Unauthorized("missing token").response(HttpStatus.UNAUTHORIZED)

        assertEquals(HttpStatus.UNAUTHORIZED, response.statusCode)
        assertEquals("application/problem+json", response.headers.getFirst("Content-Type"))
        assertEquals(Problem.Unauthorized("missing token"), response.body)
    }

    @Test
    fun `all problem variants expose stable title and payload fields`() {
        val variants =
            listOf(
                Problem.UnknownError,
                Problem.MemberNotFound,
                Problem.ValidationError("bad field"),
                Problem.MemberAlreadyExists("email", "x@example.test"),
                Problem.UserNotFound("id", 1),
                Problem.UserAlreadyExists("username", "u"),
                Problem.AthleteNotFound("id", 2),
                Problem.AthleteAlreadyRegistered(3),
                Problem.TeamCategoryNotFound(4),
                Problem.GuardianMemberNotFound(1001),
                Problem.AthleteInvalidStateTransition(5, "PENDENTE", "approve"),
                Problem.InvalidAthleteDateField("birthDate", "future date"),
                Problem.UserRelatedResourceNotFound("memberId", 6),
                Problem.SponsorNotFound(7),
                Problem.SponsorshipNotFound(8),
                Problem.Unauthorized("nope"),
                Problem.InvalidTransition("PENDENTE", "reactivate"),
                Problem.InvalidOperation("payment", "already paid"),
            )

        variants.forEach {
            assertNotNull(it.type)
            assertNotNull(it.title)
            assertEquals(it.type.substringAfterLast("/"), it.title)
        }
    }
}
