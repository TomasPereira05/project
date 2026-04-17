package pt.isel.jagoz.http.pipeline

import org.springframework.stereotype.Component
import pt.isel.jagoz.domain.user.AuthenticatedUser
import pt.isel.jagoz.domain.user.toAuthenticatedUser
import pt.isel.jagoz.service.UserService

@Component
class RequestTokenProcessor(
    val usersService: UserService,
) {
    fun processAuthorizationHeaderValue(authorizationValue: String?): AuthenticatedUser? {
        if (authorizationValue == null) {
            return null
        }
        val parts = authorizationValue.trim().split(" ")
        if (parts.size != 2) {
            return null
        }
        if (parts[0].lowercase() != SCHEME) {
            return null
        }
        return usersService.getUserByToken(parts[1])?.toAuthenticatedUser(parts[1])
    }

    companion object {
        const val SCHEME = "bearer"
    }
}
