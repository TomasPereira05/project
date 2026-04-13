package pt.isel.jagoz.http

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
import pt.isel.jagoz.http.model.member.ApprovalRequest
import pt.isel.jagoz.http.model.member.CategoryRequest
import pt.isel.jagoz.http.model.member.ReactivationRequest
import pt.isel.jagoz.http.utils.Problem
import pt.isel.jagoz.http.utils.Uris
import pt.isel.jagoz.member.Member
import pt.isel.jagoz.member.MemberError
import pt.isel.jagoz.service.MemberService
import pt.isel.jagoz.utils.handle

@RestController
class MemberController(
    private val memberService: MemberService,
) {
    @GetMapping(Uris.Members.GET_BY_ID)
    fun getMemberById(
        @PathVariable memberId: Long,
    ): ResponseEntity<*> {
        return memberService.getMemberById(memberId).handle(
            onFailure = { error ->
                when (error) {
                    is MemberError.NotFound -> Problem.MemberNotFound.response(HttpStatus.NOT_FOUND)
                    is MemberError.ValidationError -> Problem.ValidationError(error.message).response(HttpStatus.BAD_REQUEST)
                    else -> ResponseEntity.internalServerError().build()
                }
            },
            onSuccess = { res -> ResponseEntity.ok(res) },
        )
    }

    @GetMapping(Uris.Members.GET_MEMBERS)
    fun getAllMembers(): ResponseEntity<List<Member>> {
        val members = memberService.getAllMembers()
        return ResponseEntity.ok(members)
    }

    @GetMapping(Uris.Members.GET_ACTIVE_MEMBERS)
    fun getAllActiveMembers(): ResponseEntity<List<Member>> {
        val members = memberService.getAllActiveMembers()
        return ResponseEntity.ok(members)
    }

    @PostMapping(Uris.Members.CREATE_MEMBER)
    fun createMember(
        @RequestBody member: Member,
    ): ResponseEntity<*> {
        return memberService.createMember(member).handle(
            onFailure = { error ->
                when (error) {
                    is MemberError.ValidationError -> Problem.ValidationError(error.message).response(HttpStatus.BAD_REQUEST)
                    is MemberError.AlreadyExists -> Problem.MemberAlreadyExists(error.field, error.value).response(HttpStatus.CONFLICT)
                    else -> ResponseEntity.internalServerError().build()
                }
            },
            onSuccess = { res -> ResponseEntity.ok(res) },
        )
    }

    @PutMapping(Uris.Members.UPDATE_MEMBER)
    fun updateMemberContact(
        @PathVariable memberId: Long,
        @RequestParam email: String,
        @RequestParam phone: String,
        @RequestParam address: String,
        @RequestParam postalCode: String,
        @RequestParam city: String,
        @RequestParam(required = false) homePhone: String?,
        @RequestParam(required = false) billingLocation: String?,
    ): ResponseEntity<*> {
        return memberService.updateMemberContact(
            memberId,
            email,
            phone,
            address,
            postalCode,
            city,
            homePhone,
            billingLocation,
        ).handle(
            onFailure = { error ->
                when (error) {
                    is MemberError.NotFound -> Problem.MemberNotFound.response(HttpStatus.NOT_FOUND)
                    is MemberError.ValidationError -> Problem.ValidationError(error.message).response(HttpStatus.BAD_REQUEST)
                    else -> ResponseEntity.internalServerError().build()
                }
            },
            onSuccess = { res -> ResponseEntity.ok(res) },
        )
    }

    @DeleteMapping(Uris.Members.DELETE_MEMBER)
    fun deactivateMember(
        @PathVariable memberId: Long,
    ): ResponseEntity<*> {
        return memberService.deactivateMember(memberId).handle(
            onFailure = { error ->
                when (error) {
                    is MemberError.NotFound -> Problem.MemberNotFound.response(HttpStatus.NOT_FOUND)
                    is MemberError.InvalidTransition ->
                        Problem.InvalidTransition(
                            error.from.toString(),
                            error.attempted,
                        ).response(HttpStatus.BAD_REQUEST)
                    else -> ResponseEntity.internalServerError().build()
                }
            },
            onSuccess = { res -> ResponseEntity.ok(res) },
        )
    }

    @PutMapping(Uris.Members.APPROVE_MEMBER)
    fun approveMember(
        @PathVariable memberId: Long,
        @RequestBody approvalRequest: ApprovalRequest,
    ): ResponseEntity<*> {
        return memberService.approveMember(memberId, approvalRequest.approvalDate).handle(
            onFailure = { error ->
                when (error) {
                    is MemberError.NotFound -> Problem.MemberNotFound.response(HttpStatus.NOT_FOUND)
                    is MemberError.InvalidTransition ->
                        Problem.InvalidTransition(
                            error.from.toString(),
                            error.attempted,
                        ).response(HttpStatus.BAD_REQUEST)
                    else -> ResponseEntity.internalServerError().build()
                }
            },
            onSuccess = { res -> ResponseEntity.ok(res) },
        )
    }

    @PutMapping(Uris.Members.REJECT_MEMBER)
    fun rejectMember(
        @PathVariable memberId: Long,
    ): ResponseEntity<*> {
        return memberService.rejectMember(memberId).handle(
            onFailure = { error ->
                when (error) {
                    is MemberError.NotFound -> Problem.MemberNotFound.response(HttpStatus.NOT_FOUND)
                    is MemberError.InvalidTransition ->
                        Problem.InvalidTransition(
                            error.from.toString(),
                            error.attempted,
                        ).response(HttpStatus.BAD_REQUEST)
                    else -> ResponseEntity.internalServerError().build()
                }
            },
            onSuccess = { res -> ResponseEntity.ok(res) },
        )
    }

    @PutMapping(Uris.Members.REACTIVATE_MEMBER)
    fun reactivateMember(
        @PathVariable memberId: Long,
        @RequestBody reactivationRequest: ReactivationRequest,
    ): ResponseEntity<*> {
        return memberService.reactivateMember(memberId, reactivationRequest.reactivationDate).handle(
            onFailure = { error ->
                when (error) {
                    is MemberError.NotFound -> Problem.MemberNotFound.response(HttpStatus.NOT_FOUND)
                    is MemberError.InvalidTransition ->
                        Problem.InvalidTransition(
                            error.from.toString(),
                            error.attempted,
                        ).response(HttpStatus.BAD_REQUEST)
                    else -> ResponseEntity.internalServerError().build()
                }
            },
            onSuccess = { res -> ResponseEntity.ok(res) },
        )
    }

    @PutMapping(Uris.Members.CHANGE_CATEGORY)
    fun changeMemberCategory(
        @PathVariable memberId: Long,
        @RequestBody categoryRequest: CategoryRequest,
    ): ResponseEntity<*> {
        return memberService.changeMemberCategory(memberId, categoryRequest.category).handle(
            onFailure = { error ->
                when (error) {
                    is MemberError.NotFound -> Problem.MemberNotFound.response(HttpStatus.NOT_FOUND)
                    is MemberError.InvalidOperation ->
                        Problem.InvalidOperation(
                            error.operation,
                            error.reason,
                        ).response(HttpStatus.BAD_REQUEST)
                    else -> ResponseEntity.internalServerError().build()
                }
            },
            onSuccess = { res -> ResponseEntity.ok(res) },
        )
    }
}
