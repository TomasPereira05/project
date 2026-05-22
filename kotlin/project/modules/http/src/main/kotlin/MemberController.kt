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
import pt.isel.jagoz.domain.member.MemberError
import pt.isel.jagoz.domain.member.MemberCategory
import pt.isel.jagoz.domain.utils.handle
import pt.isel.jagoz.http.model.member.ApprovalRequest
import pt.isel.jagoz.http.model.member.CategoryRequest
import pt.isel.jagoz.http.model.member.MemberCreateInput
import pt.isel.jagoz.http.model.member.MemberOutput
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
        @PathVariable memberId: Long,
    ): ResponseEntity<*> =
        memberService.getMemberById(memberId).handle(
            onFailure = { error -> handleMemberError(error) },
            onSuccess = { res -> ResponseEntity.ok(res.tooutput()) },
        )

    @GetMapping(Uris.Members.GET_MEMBERS)
    fun getAllMembers(
        @RequestParam(defaultValue = "1") page: Int,
        @RequestParam(defaultValue = "8") size: Int,
        @RequestParam(required = false) search: String?,
        @RequestParam(required = false) category: MemberCategory?,
    ): ResponseEntity<Page<MemberOutput>> {
        val members = memberService.getMembersPage(page, size, search, category)
        return ResponseEntity.ok(
            Page(
                items = members.items.map { it.tooutput() },
                page = members.page,
                size = members.size,
                total = members.total,
                totalPages = members.totalPages,
            ),
        )
    }

    @GetMapping(Uris.Members.GET_ACTIVE_MEMBERS)
    fun getAllActiveMembers(): ResponseEntity<List<MemberOutput>> {
        val members = memberService.getAllActiveMembers().map { it.tooutput() }
        return ResponseEntity.ok(members)
    }

    @PostMapping(Uris.Members.CREATE_MEMBER)
    fun createMember(
        @RequestBody member: MemberCreateInput,
    ): ResponseEntity<*> =
        memberService.createMember(member.toMember()).handle(
            onFailure = { error -> handleMemberError(error) },
            onSuccess = { res -> ResponseEntity.ok(res.tooutput()) },
        )

    @PutMapping(Uris.Members.UPDATE_MEMBER)
    fun updateMember(
        @PathVariable memberId: Long,
        @RequestBody input: MemberUpdateInput,
    ): ResponseEntity<*> =
        memberService.updateMember(memberId, input.toCandidate()).handle(
            onFailure = { error -> handleMemberError(error) },
            onSuccess = { res -> ResponseEntity.ok(res.tooutput()) },
        )

    @DeleteMapping(Uris.Members.DELETE_MEMBER)
    fun deactivateMember(
        @PathVariable memberId: Long,
    ): ResponseEntity<*> =
        memberService.deactivateMember(memberId).handle(
            onFailure = { error -> handleMemberError(error) },
            onSuccess = { res -> ResponseEntity.ok(res.tooutput()) },
        )

    @PutMapping(Uris.Members.APPROVE_MEMBER)
    fun approveMember(
        @PathVariable memberId: Long,
        @RequestBody approvalRequest: ApprovalRequest,
    ): ResponseEntity<*> =
        memberService.approveMember(memberId, approvalRequest.approvalDate.toLocalDate()).handle(
            onFailure = { error -> handleMemberError(error) },
            onSuccess = { res -> ResponseEntity.ok(res.tooutput()) },
        )

    @PutMapping(Uris.Members.REJECT_MEMBER)
    fun rejectMember(
        @PathVariable memberId: Long,
    ): ResponseEntity<*> =
        memberService.rejectMember(memberId).handle(
            onFailure = { error -> handleMemberError(error) },
            onSuccess = { res -> ResponseEntity.ok(res.tooutput()) },
        )

    @PutMapping(Uris.Members.REACTIVATE_MEMBER)
    fun reactivateMember(
        @PathVariable memberId: Long,
        @RequestBody reactivationRequest: ReactivationRequest,
    ): ResponseEntity<*> =
        memberService.reactivateMember(memberId, reactivationRequest.reactivationDate).handle(
            onFailure = { error -> handleMemberError(error) },
            onSuccess = { res -> ResponseEntity.ok(res.tooutput()) },
        )

    @PutMapping(Uris.Members.CHANGE_CATEGORY)
    fun changeMemberCategory(
        @PathVariable memberId: Long,
        @RequestBody categoryRequest: CategoryRequest,
    ): ResponseEntity<*> =
        memberService.changeMemberCategory(memberId, categoryRequest.category).handle(
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
