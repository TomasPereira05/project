package pt.isel.jagoz.service

import jakarta.inject.Named
import kotlinx.datetime.LocalDate
import org.slf4j.LoggerFactory
import pt.isel.jagoz.domain.member.Member
import pt.isel.jagoz.domain.member.MemberCategory
import pt.isel.jagoz.domain.member.MemberDomain
import pt.isel.jagoz.domain.member.MemberError
import pt.isel.jagoz.domain.utils.Either
import pt.isel.jagoz.domain.utils.failure
import pt.isel.jagoz.domain.utils.success
import pt.isel.jagoz.repository.Transaction
import pt.isel.jagoz.repository.TransactionManager

typealias MemberResult = Either<MemberError, Member>

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
     * Validates the member data and persists it with a generated member number.
     *
     * @param member the member data to register (memberId will be ignored, memberNumber will be generated)
     * @return Either a [MemberError] if validation fails or the created [Member] with assigned ID and number
     */
    fun createMember(member: Member): MemberResult {
        LOG.info("Creating new member registration for: ${member.email}")

        return transactionManager.run { transaction ->
            // Validate the member data
            val validationResult = memberDomain.validateForCreation(member)
            if (validationResult is Either.Left) {
                LOG.warn("Member validation failed: ${validationResult.value}")
                return@run validationResult
            }

            // Generate member number
            val memberNumber = transaction.memberRepository.nextMemberNumber()
            LOG.debug("Generated member number: $memberNumber")

            // Create member with generated number (ID will be assigned by DB)
            val memberToSave = member.copy(memberNumber = memberNumber)

            // Save to repository
            val memberId = transaction.memberRepository.save(memberToSave)
            val savedMember = memberToSave.copy(memberId = memberId)

            if (member.userId != null) {
                val user = transaction.userRepository.findById(member.userId!!)
                transaction.userRepository.update(user!!.copy(activeMemberId = savedMember.memberId))
            }

            LOG.info("Successfully created member with ID: $memberId and number: $memberNumber")
            success(savedMember)
        }
    }

    /**
     * Retrieves a member by their unique ID.
     *
     * @param memberId the member's ID
     * @return the [Member] if found, null otherwise
     */
    fun getMemberById(memberId: Long): MemberResult {
        LOG.debug("Retrieving member by ID: $memberId")

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
    fun getMemberByEmail(email: String): MemberResult {
        return transactionManager.run { transaction ->
            val member =
                transaction.memberRepository.findByEmail(email)
                    ?: return@run failure(MemberError.NotFound("Member with email $email", email))

            success(member)
        }
    }

    /**
     * Retrieves all members.
     *
     * @return list of all [Member]s
     */
    fun getAllMembers(): List<Member> {
        LOG.debug("Retrieving all members")

        return transactionManager.run { transaction ->
            val members = transaction.memberRepository.findAll()
            LOG.debug("Found ${members.size} members")
            members
        }
    }

    /**
     * Retrieves all active members.
     *
     * @return list of active [Member]s
     */
    fun getAllActiveMembers(): List<Member> {
        LOG.debug("Retrieving all active members")

        return transactionManager.run { transaction ->
            val members = transaction.memberRepository.findAllActive()
            LOG.debug("Found ${members.size} active members")
            members
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
    ): MemberResult {
        LOG.info("Approving member with ID: $memberId")

        return transactionManager.run { transaction ->
            val memberResult = getMemberOrFail(transaction, memberId)
            if (memberResult is Either.Left) return@run memberResult

            val member = (memberResult as Either.Right).value

            val result = memberDomain.approve(member, approvalDate)
            if (result is Either.Right) {
                val updatedMember = result.value
                transaction.memberRepository.update(updatedMember)
                LOG.info("Successfully approved member: ${updatedMember.completeName}")
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
    fun rejectMember(memberId: Long): MemberResult {
        LOG.info("Rejecting member with ID: $memberId")

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
    fun deactivateMember(memberId: Long): MemberResult {
        LOG.info("Deactivating member with ID: $memberId")

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
    ): MemberResult {
        LOG.info("Reactivating member with ID: $memberId")

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
    ): MemberResult {
        LOG.info("Updating contact details for member ID: $memberId")

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
    ): MemberResult {
        LOG.info("Changing category for member ID: $memberId to $newCategory")

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
