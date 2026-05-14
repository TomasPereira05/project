package pt.isel.jagoz.http

import jakarta.servlet.http.HttpServletRequest
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseCookie
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import pt.isel.jagoz.domain.user.AuthenticatedUser
import pt.isel.jagoz.domain.user.UserError
import pt.isel.jagoz.domain.utils.handle
import pt.isel.jagoz.http.model.user.AuthenticatedUserOutputModel
import pt.isel.jagoz.http.model.user.CreateUserRequest
import pt.isel.jagoz.http.model.user.LoginRequest
import pt.isel.jagoz.http.model.user.UserCreateTokenInputModel
import pt.isel.jagoz.http.model.user.UserTokenCreateOutputModel
import pt.isel.jagoz.http.model.user.toOutputModel
import pt.isel.jagoz.http.utils.Problem
import pt.isel.jagoz.http.utils.Uris
import pt.isel.jagoz.service.Page
import pt.isel.jagoz.service.UserService
import java.time.Duration

@RestController
class UserController(
    private val userService: UserService,
) {
    @PostMapping(Uris.Users.CREATE_USER)
    fun createUser(
        @RequestBody request: CreateUserRequest,
    ): ResponseEntity<*> =
        userService
            .createUser(
                email = request.email,
                username = request.username,
                password = request.password,
                role = request.role,
                activeMemberId = request.activeMemberId,
            ).handle(
                onFailure = { error -> serviceErrorToProblem(error) },
                onSuccess = { created ->
                    ResponseEntity
                        .status(HttpStatus.CREATED)
                        .body(created.toOutputModel())
                },
            )

    @GetMapping(Uris.Users.GET_ALL)
    fun getUsers(
        authenticatedUser: AuthenticatedUser,
        @RequestParam(defaultValue = "1") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
    ): ResponseEntity<*> =
        userService.getUsersPage(authenticatedUser, page, size).handle(
            onFailure = { error -> serviceErrorToProblem(error) },
            onSuccess = { usersPage ->
                ResponseEntity.ok(
                    Page(
                        items = usersPage.items.map { it.toOutputModel() },
                        page = usersPage.page,
                        size = usersPage.size,
                        total = usersPage.total,
                        totalPages = usersPage.totalPages,
                    ),
                )
            },
        )

    @GetMapping(Uris.Users.GET_BY_ID)
    fun getUserById(
        authenticatedUser: AuthenticatedUser,
        @PathVariable userId: Long,
    ): ResponseEntity<*> =
        userService.getUserById(authenticatedUser, userId).handle(
            onFailure = { error ->
                serviceErrorToProblem(error)
            },
            onSuccess = { user -> ResponseEntity.ok(user.toOutputModel()) },
        )

    @GetMapping(Uris.Users.GET_BY_EMAIL)
    fun getUserByEmail(
        authenticatedUser: AuthenticatedUser,
        @RequestParam email: String,
    ): ResponseEntity<*> =
        userService.getUserByEmail(authenticatedUser, email).handle(
            onFailure = { error ->
                serviceErrorToProblem(error)
            },
            onSuccess = { user -> ResponseEntity.ok(user.toOutputModel()) },
        )

    @GetMapping(Uris.Users.GET_BY_USERNAME)
    fun getUserByUsername(
        authenticatedUser: AuthenticatedUser,
        @RequestParam username: String,
    ): ResponseEntity<*> =
        userService.getUserByUsername(authenticatedUser, username).handle(
            onFailure = { error ->
                serviceErrorToProblem(error)
            },
            onSuccess = { user -> ResponseEntity.ok(user.toOutputModel()) },
        )

    @PostMapping(Uris.Users.LOGIN)
    fun login(
        @RequestBody request: LoginRequest,
        httpRequest: HttpServletRequest,
    ): ResponseEntity<*> =
        userService.login(request.identifier, request.password).handle(
            onFailure = { error ->
                serviceErrorToProblem(error)
            },
            onSuccess = { res ->
                val cookie =
                    ResponseCookie
                        .from("token", res.token)
                        .httpOnly(true)
                        .secure(httpRequest.isSecure)
                        .sameSite("Strict")
                        .path("/")
                        .maxAge(Duration.ofHours(24))
                        .build()

                ResponseEntity
                    .status(HttpStatus.CREATED)
                    .header("Set-Cookie", cookie.toString())
                    .body(
                        AuthenticatedUserOutputModel(
                            res.userId,
                            res.email,
                            res.username,
                            res.activeMemberId,
                            res.role,
                            res.token,
                        ),
                    )
            },
        )

    @PostMapping(Uris.Users.LOGOUT)
    fun logout(
        authenticatedUser: AuthenticatedUser,
        httpRequest: HttpServletRequest,
    ): ResponseEntity<*> =
        userService.logout(authenticatedUser.token).handle(
            onFailure = { error ->
                serviceErrorToProblem(error)
            },
            onSuccess = {
                val cookie =
                    ResponseCookie
                        .from("token", "")
                        .httpOnly(true)
                        .secure(httpRequest.isSecure)
                        .sameSite("Strict")
                        .path("/")
                        .maxAge(0)
                        .build()

                ResponseEntity
                    .status(HttpStatus.NO_CONTENT)
                    .header("Set-Cookie", cookie.toString())
                    .build<Unit>()
            },
        )

    @PostMapping(Uris.Users.TOKEN)
    fun token(
        @Valid @RequestBody input: UserCreateTokenInputModel,
    ): ResponseEntity<*> =
        userService.createToken(input.username, input.password).handle(
            onSuccess = { res ->
                ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(UserTokenCreateOutputModel(res.tokenValue))
            },
            onFailure = { error ->
                serviceErrorToProblem(error)
            },
        )

    @GetMapping(Uris.Users.ME)
    fun me(authenticatedUser: AuthenticatedUser): ResponseEntity<AuthenticatedUser> = ResponseEntity.ok(authenticatedUser)

    private fun serviceErrorToProblem(error: UserError): ResponseEntity<*> =
        when (error) {
            is UserError.NotFound -> Problem.UserNotFound(error.field, error.value).response(HttpStatus.NOT_FOUND)
            is UserError.AlreadyExists -> Problem.UserAlreadyExists(error.field, error.value).response(HttpStatus.CONFLICT)
            is UserError.Validation -> Problem.ValidationError(error.message).response(HttpStatus.BAD_REQUEST)
            is UserError.Unauthorized -> Problem.Unauthorized(error.message).response(HttpStatus.UNAUTHORIZED)
        }
}
