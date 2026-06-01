package pt.isel.jagoz.http.model

import pt.isel.jagoz.domain.user.PasswordValidationInfo
import pt.isel.jagoz.domain.user.Role
import pt.isel.jagoz.domain.user.User
import pt.isel.jagoz.http.model.user.UserAssociationsOutput
import pt.isel.jagoz.http.model.user.UserAthleteAssociationOutput
import pt.isel.jagoz.http.model.user.UserMemberAssociationOutput
import pt.isel.jagoz.http.model.user.UserSponsorAssociationOutput
import pt.isel.jagoz.http.model.user.toOutputModel
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNull

class UserModelTests {
    @Test
    fun `domain user maps to output without password validation`() {
        val output =
            User(
                userId = 5,
                email = "u@example.test",
                username = "user",
                passwordValidation = PasswordValidationInfo("secret-hash"),
                role = Role.SECRETARIA,
                activeMemberId = 9,
            ).toOutputModel()

        assertEquals(5, output.userId)
        assertEquals("u@example.test", output.email)
        assertEquals("user", output.username)
        assertEquals(Role.SECRETARIA, output.role)
        assertEquals(9, output.activeMemberId)
    }

    @Test
    fun `association output groups optional member athlete and sponsor links`() {
        val associations =
            UserAssociationsOutput(
                member =
                    UserMemberAssociationOutput(
                        memberId = 1,
                        memberNumber = 1001,
                        completeName = "Socio",
                        email = "socio@example.test",
                        status = "ATIVO",
                    ),
                athlete =
                    UserAthleteAssociationOutput(
                        athleteId = 2,
                        memberId = 1,
                        teamCategory = "Juniores",
                        season = null,
                        active = true,
                    ),
                sponsors =
                    listOf(
                        UserSponsorAssociationOutput(
                            sponsorId = 3,
                            name = "Sponsor",
                            email = "sponsor@example.test",
                            phone = "211000000",
                            nif = "123456789",
                        ),
                    ),
            )

        assertEquals(1001, associations.member?.memberNumber)
        assertEquals(2, associations.athlete?.athleteId)
        assertNull(associations.athlete?.season)
        assertEquals("Sponsor", associations.sponsors.single().name)
    }
}
