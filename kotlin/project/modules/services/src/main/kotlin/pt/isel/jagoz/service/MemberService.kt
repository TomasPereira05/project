package pt.isel.jagoz.service

import jakarta.inject.Named
import kotlinx.datetime.LocalDate
import org.slf4j.LoggerFactory
import pt.isel.jagoz.domain.member.Member
import pt.isel.jagoz.domain.member.MemberCategory
import pt.isel.jagoz.domain.member.MemberDomain
import pt.isel.jagoz.domain.member.MemberError
import pt.isel.jagoz.domain.member.MemberStatus
import pt.isel.jagoz.domain.user.AuthenticatedUser
import pt.isel.jagoz.domain.user.canManageBackoffice
import pt.isel.jagoz.domain.utils.Either
import pt.isel.jagoz.domain.utils.failure
import pt.isel.jagoz.domain.utils.success
import pt.isel.jagoz.repository.Transaction
import pt.isel.jagoz.repository.TransactionManager

typealias MemberResult = Either<MemberError, Member>
typealias MemberListResult = Either<MemberError, List<Member>>
typealias MemberPageResult = Either<MemberError, Page<Member>>

/**
 * Service layer for member management operations.
 * Handles business logic, validation, and transaction management for member-related actions.
 */
@Named
class MemberService(
    private val transactionManager: TransactionManager,
    private val memberDomain: MemberDomain,
) {
    companion object {
        private val LOG = LoggerFactory.getLogger(MemberService::class.java)
    }

    /**
     * Creates a new member registration.
     * Validates the member data and persists it without consuming a member number until approval.
     *
     * @param member the member data to register (memberId and memberNumber will be ignored)
     * @return Either a [MemberError] if validation fails or the created [Member] with assigned ID
     */
    fun createMember(
        member: Member,
        linkedUsername: String? = null,
        authenticatedUser: AuthenticatedUser,
    ): MemberResult {
        LOG.info("Creating new member registration for: ${member.email}")

        return transactionManager.run { transaction ->
            val linkedUser =
                linkedUsername
                    ?.trim()
                    ?.takeIf { it.isNotEmpty() }
                    ?.let { username ->
                        transaction.userRepository.findByUsername(username)
                            ?: return@run failure(MemberError.NotFound("User with username", username))
                    }
            val memberCandidate = member.copy(userId = linkedUser?.userId ?: member.userId)

            // Validate the member data
            val validationResult = memberDomain.validateForCreation(memberCandidate)
            if (validationResult is Either.Left) {
                LOG.warn("Member validation failed: ${validationResult.value}")
                return@run validationResult
            }

            val memberToSave = memberCandidate.copy(memberNumber = 0)

            // Save to repository
            val memberId = transaction.memberRepository.save(memberToSave)
            val savedMember = memberToSave.copy(memberId = memberId)

            val memberUserId = memberToSave.userId
            if (memberUserId != null) {
                val user =
                    transaction.userRepository.findById(memberUserId)
                        ?: return@run failure(MemberError.NotFound("User", memberUserId))
                transaction.userRepository.update(user.copy(activeMemberId = savedMember.memberId))
            }

            LOG.info("Successfully created pending member with ID: $memberId")
            success(savedMember)
        }
    }

    /**
     * Retrieves a member by their unique ID.
     *
     * @param memberId the member's ID
     * @return the [Member] if found, null otherwise
     */
    fun getMemberById(
        memberId: Long,
        authenticatedUser: AuthenticatedUser,
    ): MemberResult {
        LOG.debug("Retrieving member by ID: $memberId")

        if (!authenticatedUser.canManageBackoffice() && authenticatedUser.activeMemberId != memberId) {
            return failure(MemberError.Forbidden("Not authorized"))
        }

        return transactionManager.run { transaction ->
            val memberResult = getMemberOrFail(transaction, memberId)
            if (memberResult is Either.Left) return@run memberResult

            val member = (memberResult as Either.Right).value
            LOG.debug("Found member: ${member.completeName}")
            success(member)
        }
    }

    /**
     * Retrieves a member by their email address.
     *
     * @param email the member's email
     * @return the [Member] if found, null otherwise
     */
    fun getMemberByEmail(
        email: String,
        authenticatedUser: AuthenticatedUser,
    ): MemberResult {
        if (!authenticatedUser.canManageBackoffice()) {
            return failure(MemberError.Unauthorized("Not authorized"))
        }

        return transactionManager.run { transaction ->
            val member =
                transaction.memberRepository.findByEmail(email)
                    ?: return@run failure(MemberError.NotFound("Member with email $email", email))

            success(member)
        }
    }

    fun getMembersPage(
        page: Int,
        size: Int,
        search: String? = null,
        category: MemberCategory? = null,
        status: MemberStatus? = null,
        authenticatedUser: AuthenticatedUser,
    ): MemberPageResult {
        LOG.debug("Retrieving members page $page with size $size")

        if (!authenticatedUser.canManageBackoffice()) {
            return failure(MemberError.Unauthorized("Not authorized"))
        }

        val request = pageRequest(page, size)
        val normalizedSearch = search?.trim()?.takeIf { it.isNotEmpty() }
        return transactionManager.run { transaction ->
            success(
                pageOf(
                    items =
                        transaction.memberRepository.findPageFiltered(
                            request.size,
                            request.offset,
                            normalizedSearch,
                            category,
                            status,
                        ),
                    request = request,
                    total = transaction.memberRepository.countFiltered(normalizedSearch, category, status),
                ),
            )
        }
    }

    /**
     * Retrieves all active members.
     *
     * @return list of active [Member]s
     */
    fun getAllActiveMembers(authenticatedUser: AuthenticatedUser): MemberListResult {
        LOG.debug("Retrieving all active members")

        if (!authenticatedUser.canManageBackoffice()) {
            return failure(MemberError.Unauthorized("Not authorized"))
        }

        return transactionManager.run { transaction ->
            val members = transaction.memberRepository.findAllActive()
            LOG.debug("Found ${members.size} active members")
            success(members)
        }
    }

    /**
     * Approves a pending member application.
     * Changes status from PENDENTE to ATIVO and sets approval date.
     *
     * @param memberId the ID of the member to approve
     * @param approvalDate the date of approval
     * @return Either a [MemberError] if the operation fails or the updated [Member]
     */
    fun approveMember(
        memberId: Long,
        approvalDate: LocalDate,
        authenticatedUser: AuthenticatedUser,
    ): MemberResult {
        LOG.info("Approving member with ID: $memberId")

        if (!authenticatedUser.canManageBackoffice()) {
            return failure(MemberError.Unauthorized("Not authorized"))
        }

        return transactionManager.run { transaction ->
            val memberResult = getMemberOrFail(transaction, memberId)
            if (memberResult is Either.Left) return@run memberResult

            val member = (memberResult as Either.Right).value

            val memberNumber =
                if (member.memberNumber > 0) {
                    member.memberNumber
                } else {
                    transaction.memberRepository.nextMemberNumber()
                }
            val memberForApproval = member.copy(memberNumber = memberNumber)

            val result = memberDomain.approve(memberForApproval, approvalDate)
            if (result is Either.Right) {
                val updatedMember = result.value
                transaction.memberRepository.update(updatedMember)
                LOG.info("Successfully approved member: ${updatedMember.completeName} with number ${updatedMember.memberNumber}")
                success(updatedMember)
            } else {
                LOG.warn("Failed to approve member: ${(result as Either.Left).value}")
                result
            }
        }
    }

    /**
     * Rejects a pending member application.
     * Changes status from PENDENTE to REJEITADO.
     *
     * @param memberId the ID of the member to reject
     * @return Either a [MemberError] if the operation fails or the updated [Member]
     */
    fun rejectMember(
        memberId: Long,
        authenticatedUser: AuthenticatedUser,
    ): MemberResult {
        LOG.info("Rejecting member with ID: $memberId")

        if (!authenticatedUser.canManageBackoffice()) {
            return failure(MemberError.Unauthorized("Not authorized"))
        }

        return transactionManager.run { transaction ->
            val memberResult = getMemberOrFail(transaction, memberId)
            if (memberResult is Either.Left) return@run memberResult

            val member = (memberResult as Either.Right).value

            val result = memberDomain.reject(member)
            if (result is Either.Right) {
                val updatedMember = result.value
                transaction.memberRepository.update(updatedMember)
                LOG.info("Successfully rejected member: ${updatedMember.completeName}")
                success(updatedMember)
            } else {
                LOG.warn("Failed to reject member: ${(result as Either.Left).value}")
                result
            }
        }
    }

    /**
     * Deactivates an active member.
     * Changes status from ATIVO to INATIVO.
     *
     * @param memberId the ID of the member to deactivate
     * @return Either a [MemberError] if the operation fails or the updated [Member]
     */
    fun deactivateMember(
        memberId: Long,
        authenticatedUser: AuthenticatedUser,
    ): MemberResult {
        LOG.info("Deactivating member with ID: $memberId")

        if (!authenticatedUser.canManageBackoffice()) {
            return failure(MemberError.Unauthorized("Not authorized"))
        }

        return transactionManager.run { transaction ->
            val memberResult = getMemberOrFail(transaction, memberId)
            if (memberResult is Either.Left) return@run memberResult

            val member = (memberResult as Either.Right).value

            val result = memberDomain.deactivate(member)
            if (result is Either.Right) {
                val updatedMember = result.value
                transaction.memberRepository.update(updatedMember)
                LOG.info("Successfully deactivated member: ${updatedMember.completeName}")
                success(updatedMember)
            } else {
                LOG.warn("Failed to deactivate member: ${(result as Either.Left).value}")
                result
            }
        }
    }

    /**
     * Reactivates an inactive member.
     * Changes status from INATIVO to ATIVO and sets reactivation date.
     *
     * @param memberId the ID of the member to reactivate
     * @param reactivationDate the date of reactivation
     * @return Either a [MemberError] if the operation fails or the updated [Member]
     */
    fun reactivateMember(
        memberId: Long,
        reactivationDate: LocalDate,
        authenticatedUser: AuthenticatedUser,
    ): MemberResult {
        LOG.info("Reactivating member with ID: $memberId")

        if (!authenticatedUser.canManageBackoffice()) {
            return failure(MemberError.Unauthorized("Not authorized"))
        }

        return transactionManager.run { transaction ->
            val memberResult = getMemberOrFail(transaction, memberId)
            if (memberResult is Either.Left) return@run memberResult

            val member = (memberResult as Either.Right).value

            val result = memberDomain.reactivate(member, reactivationDate)
            if (result is Either.Right) {
                val updatedMember = result.value
                transaction.memberRepository.update(updatedMember)
                LOG.info("Successfully reactivated member: ${updatedMember.completeName}")
                success(updatedMember)
            } else {
                LOG.warn("Failed to reactivate member: ${(result as Either.Left).value}")
                result
            }
        }
    }

    /**
     * Updates the contact details of a member.
     *
     * @param memberId the ID of the member to update
     * @param email new email address
     * @param phone new phone number
     * @param address new street address
     * @param postalCode new postal code
     * @param city new city
     * @param homePhone optional home phone
     * @param billingLocation optional billing location
     * @return Either a [MemberError] if the operation fails or the updated [Member]
     */
    fun updateMemberContact(
        memberId: Long,
        email: String,
        phone: String,
        address: String,
        postalCode: String,
        city: String,
        homePhone: String? = null,
        billingLocation: String? = null,
        authenticatedUser: AuthenticatedUser,
    ): MemberResult {
        LOG.info("Updating contact details for member ID: $memberId")

        if (!authenticatedUser.canManageBackoffice()) {
            return failure(MemberError.Unauthorized("Not authorized"))
        }

        return transactionManager.run { transaction ->
            val memberResult = getMemberOrFail(transaction, memberId)
            if (memberResult is Either.Left) return@run memberResult

            val member = (memberResult as Either.Right).value
            val result =
                memberDomain.updateContact(
                    member,
                    email,
                    phone,
                    address,
                    postalCode,
                    city,
                    homePhone,
                    billingLocation,
                )
            if (result is Either.Right) {
                val updatedMember = result.value
                transaction.memberRepository.update(updatedMember)
                LOG.info("Successfully updated contact details for member: ${updatedMember.completeName}")
                success(updatedMember)
            } else {
                LOG.warn("Failed to update contact details: ${(result as Either.Left).value}")
                result
            }
        }
    }

    fun updateMember(
        memberId: Long,
        candidate: Member,
        authenticatedUser: AuthenticatedUser,
    ): MemberResult {
        LOG.info("Updating member ID: $memberId")

        if (!authenticatedUser.canManageBackoffice() && authenticatedUser.activeMemberId != memberId) {
            return failure(MemberError.Forbidden("Not authorized"))
        }

        return transactionManager.run { transaction ->
            val memberResult = getMemberOrFail(transaction, memberId)
            if (memberResult is Either.Left) return@run memberResult

            val current = (memberResult as Either.Right).value
            when (val result = memberDomain.update(current, candidate)) {
                is Either.Left -> {
                    LOG.warn("Member update validation failed: ${result.value}")
                    result
                }

                is Either.Right -> {
                    val updated = result.value
                    transaction.memberRepository.update(updated)
                    LOG.info("Successfully updated member: ${updated.completeName}")
                    success(updated)
                }
            }
        }
    }

    /**
     * Changes the category of a member.
     * Updates monthly quota according to category rules.
     *
     * @param memberId the ID of the member to update
     * @param newCategory the new category to assign
     * @return Either a [MemberError] if the operation fails or the updated [Member]
     */
    fun changeMemberCategory(
        memberId: Long,
        newCategory: MemberCategory,
        authenticatedUser: AuthenticatedUser,
    ): MemberResult {
        LOG.info("Changing category for member ID: $memberId to $newCategory")

        if (!authenticatedUser.canManageBackoffice()) {
            return failure(MemberError.Unauthorized("Not authorized"))
        }

        return transactionManager.run { transaction ->
            val memberResult = getMemberOrFail(transaction, memberId)
            if (memberResult is Either.Left) return@run memberResult

            val member = (memberResult as Either.Right).value

            val result = memberDomain.changeCategory(member, newCategory)
            if (result is Either.Right) {
                val updatedMember = result.value
                transaction.memberRepository.update(updatedMember)
                LOG.info("Successfully changed category for member: ${updatedMember.completeName} to $newCategory")
                success(updatedMember)
            } else {
                LOG.warn("Failed to change category: ${(result as Either.Left).value}")
                result
            }
        }
    }

    private fun getMemberOrFail(
        transaction: Transaction,
        memberId: Long,
    ): MemberResult {
        val member =
            transaction.memberRepository.findById(memberId)
                ?: return failure(MemberError.NotFound("Member", memberId))

        return success(member)
    }
}
