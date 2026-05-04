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
        val normalized = authorizationValue?.trim()
        if (normalized.isNullOrBlank()) {
            return null
        }

        val token =
            if (normalized.startsWith("$SCHEME ", ignoreCase = true)) {
                normalized.substringAfter(' ').trim()
            } else {
                normalized
            }

        if (token.isBlank()) return null

        return usersService.getUserByToken(token)?.toAuthenticatedUser(token)
    }

    companion object {
        const val SCHEME = "bearer"
    }
}
