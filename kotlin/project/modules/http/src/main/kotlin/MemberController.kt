package pt.isel.jagoz.http

import kotlinx.datetime.toLocalDate
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import pt.isel.jagoz.domain.member.MemberCategory
import pt.isel.jagoz.domain.member.MemberError
import pt.isel.jagoz.domain.member.MemberStatus
import pt.isel.jagoz.domain.user.AuthenticatedUser
import pt.isel.jagoz.domain.utils.handle
import pt.isel.jagoz.http.model.member.ApprovalRequest
import pt.isel.jagoz.http.model.member.CategoryRequest
import pt.isel.jagoz.http.model.member.MemberCreateInput
import pt.isel.jagoz.http.model.member.MemberUpdateInput
import pt.isel.jagoz.http.model.member.ReactivationRequest
import pt.isel.jagoz.http.model.member.toCandidate
import pt.isel.jagoz.http.model.member.toMember
import pt.isel.jagoz.http.model.member.tooutput
import pt.isel.jagoz.http.utils.Problem
import pt.isel.jagoz.http.utils.Uris
import pt.isel.jagoz.service.MemberService
import pt.isel.jagoz.service.Page

@RestController
class MemberController(
    private val memberService: MemberService,
) {
    @GetMapping(Uris.Members.GET_BY_ID)
    fun getMemberById(
        authenticatedUser: AuthenticatedUser,
        @PathVariable memberId: Long,
    ): ResponseEntity<*> =
        memberService.getMemberById(memberId, authenticatedUser).handle(
            onFailure = { error -> handleMemberError(error) },
            onSuccess = { res -> ResponseEntity.ok(res.tooutput()) },
        )

    @GetMapping(Uris.Members.GET_MEMBERS)
    fun getAllMembers(
        authenticatedUser: AuthenticatedUser,
        @RequestParam(defaultValue = "1") page: Int,
        @RequestParam(defaultValue = "8") size: Int,
        @RequestParam(required = false) search: String?,
        @RequestParam(required = false) category: MemberCategory?,
        @RequestParam(required = false) status: MemberStatus?,
    ): ResponseEntity<*> =
        memberService.getMembersPage(page, size, search, category, status, authenticatedUser).handle(
            onFailure = { error -> handleMemberError(error) },
            onSuccess = { res ->
                ResponseEntity.ok(
                    Page(
                        items = res.items.map { it.tooutput() },
                        page = res.page,
                        size = res.size,
                        total = res.total,
                        totalPages = res.totalPages,
                    ),
                )
            },
        )

    @GetMapping(Uris.Members.GET_ACTIVE_MEMBERS)
    fun getAllActiveMembers(authenticatedUser: AuthenticatedUser): ResponseEntity<*> =
        memberService.getAllActiveMembers(authenticatedUser).handle(
            onFailure = { error -> handleMemberError(error) },
            onSuccess = { res -> ResponseEntity.ok(res.map { it.tooutput() }) },
        )

    @PostMapping(Uris.Members.CREATE_MEMBER)
    fun createMember(
        authenticatedUser: AuthenticatedUser,
        @RequestBody member: MemberCreateInput,
    ): ResponseEntity<*> =
        memberService.createMember(member.toMember(), member.linkedUsername, authenticatedUser).handle(
            onFailure = { error -> handleMemberError(error) },
            onSuccess = { res -> ResponseEntity.ok(res.tooutput()) },
        )

    @PutMapping(Uris.Members.UPDATE_MEMBER)
    fun updateMember(
        authenticatedUser: AuthenticatedUser,
        @PathVariable memberId: Long,
        @RequestBody input: MemberUpdateInput,
    ): ResponseEntity<*> =
        memberService.updateMember(memberId, input.toCandidate(), authenticatedUser).handle(
            onFailure = { error -> handleMemberError(error) },
            onSuccess = { res -> ResponseEntity.ok(res.tooutput()) },
        )

    @DeleteMapping(Uris.Members.DELETE_MEMBER)
    fun deactivateMember(
        authenticatedUser: AuthenticatedUser,
        @PathVariable memberId: Long,
    ): ResponseEntity<*> =
        memberService.deactivateMember(memberId, authenticatedUser).handle(
            onFailure = { error -> handleMemberError(error) },
            onSuccess = { res -> ResponseEntity.ok(res.tooutput()) },
        )

    @PutMapping(Uris.Members.APPROVE_MEMBER)
    fun approveMember(
        authenticatedUser: AuthenticatedUser,
        @PathVariable memberId: Long,
        @RequestBody approvalRequest: ApprovalRequest,
    ): ResponseEntity<*> =
        memberService.approveMember(memberId, approvalRequest.approvalDate.toLocalDate(), authenticatedUser).handle(
            onFailure = { error -> handleMemberError(error) },
            onSuccess = { res -> ResponseEntity.ok(res.tooutput()) },
        )

    @PutMapping(Uris.Members.REJECT_MEMBER)
    fun rejectMember(
        authenticatedUser: AuthenticatedUser,
        @PathVariable memberId: Long,
    ): ResponseEntity<*> =
        memberService.rejectMember(memberId, authenticatedUser).handle(
            onFailure = { error -> handleMemberError(error) },
            onSuccess = { res -> ResponseEntity.ok(res.tooutput()) },
        )

    @PutMapping(Uris.Members.REACTIVATE_MEMBER)
    fun reactivateMember(
        authenticatedUser: AuthenticatedUser,
        @PathVariable memberId: Long,
        @RequestBody reactivationRequest: ReactivationRequest,
    ): ResponseEntity<*> =
        memberService.reactivateMember(memberId, reactivationRequest.reactivationDate, authenticatedUser).handle(
            onFailure = { error -> handleMemberError(error) },
            onSuccess = { res -> ResponseEntity.ok(res.tooutput()) },
        )

    @PutMapping(Uris.Members.CHANGE_CATEGORY)
    fun changeMemberCategory(
        authenticatedUser: AuthenticatedUser,
        @PathVariable memberId: Long,
        @RequestBody categoryRequest: CategoryRequest,
    ): ResponseEntity<*> =
        memberService.changeMemberCategory(memberId, categoryRequest.category, authenticatedUser).handle(
            onFailure = { error -> handleMemberError(error) },
            onSuccess = { res -> ResponseEntity.ok(res.tooutput()) },
        )

    private fun handleMemberError(error: MemberError): ResponseEntity<Any> =
        when (error) {
            is MemberError.NotFound -> Problem.MemberNotFound.response(HttpStatus.NOT_FOUND)
            is MemberError.AlreadyExists -> Problem.MemberAlreadyExists(error.field, error.value).response(HttpStatus.CONFLICT)
            is MemberError.ValidationError -> Problem.ValidationError(error.message).response(HttpStatus.BAD_REQUEST)
            is MemberError.InvalidTransition ->
                Problem
                    .InvalidTransition(
                        error.from.toString(),
                        error.attempted,
                    ).response(HttpStatus.BAD_REQUEST)
            is MemberError.InvalidOperation -> Problem.InvalidOperation(error.operation, error.reason).response(HttpStatus.BAD_REQUEST)
            is MemberError.Conflict -> Problem.ValidationError(error.message).response(HttpStatus.CONFLICT)
            is MemberError.Unauthorized -> Problem.Unauthorized(error.message).response(HttpStatus.UNAUTHORIZED)
            is MemberError.Forbidden -> Problem.Unauthorized(error.message).response(HttpStatus.FORBIDDEN)
            is MemberError.DomainError -> Problem.ValidationError(error.message).response(HttpStatus.BAD_REQUEST)
        }
}
