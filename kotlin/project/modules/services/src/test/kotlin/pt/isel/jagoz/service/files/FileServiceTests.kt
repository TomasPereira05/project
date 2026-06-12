package pt.isel.jagoz.service.files

import kotlinx.datetime.Instant
import kotlinx.datetime.LocalDate
import pt.isel.jagoz.domain.athlete.Athlete
import pt.isel.jagoz.domain.athlete.AthleteStatus
import pt.isel.jagoz.domain.athlete.Guardian
import pt.isel.jagoz.domain.file.FileKind
import pt.isel.jagoz.domain.file.FileOwnerType
import pt.isel.jagoz.domain.file.StoredFile
import pt.isel.jagoz.domain.member.Member
import pt.isel.jagoz.domain.member.MemberCategory
import pt.isel.jagoz.domain.member.MemberStatus
import pt.isel.jagoz.domain.team.TeamCategory
import pt.isel.jagoz.domain.user.AuthenticatedUser
import pt.isel.jagoz.domain.user.Role
import pt.isel.jagoz.domain.utils.Either
import pt.isel.jagoz.repository.AthleteRepository
import pt.isel.jagoz.repository.ChargeItemRepository
import pt.isel.jagoz.repository.ChargeRepository
import pt.isel.jagoz.repository.EmailNotificationLogRepository
import pt.isel.jagoz.repository.EquipmentPlacementRepository
import pt.isel.jagoz.repository.EventRepository
import pt.isel.jagoz.repository.FileRepository
import pt.isel.jagoz.repository.MemberRepository
import pt.isel.jagoz.repository.OtherSportRepository
import pt.isel.jagoz.repository.PaymentRepository
import pt.isel.jagoz.repository.PubOptionRepository
import pt.isel.jagoz.repository.SeasonRepository
import pt.isel.jagoz.repository.SponsorRepository
import pt.isel.jagoz.repository.SponsorshipRepository
import pt.isel.jagoz.repository.TeamCategoryPriceOverrideRepository
import pt.isel.jagoz.repository.TeamCategoryRepository
import pt.isel.jagoz.repository.TeamGroupPriceRepository
import pt.isel.jagoz.repository.TeamGroupRepository
import pt.isel.jagoz.repository.TicketRepository
import pt.isel.jagoz.repository.Transaction
import pt.isel.jagoz.repository.TransactionManager
import pt.isel.jagoz.repository.TrainingScheduleRepository
import pt.isel.jagoz.repository.UserRepository
import kotlin.test.Test
import kotlin.test.assertContains
import kotlin.test.assertEquals
import kotlin.test.assertIs
import kotlin.test.assertNull
import kotlin.test.assertTrue

class FileServiceTests {
    private val admin = auth(Role.ADMIN, userId = 1)
    private val normal = auth(Role.NORMAL, userId = 10, activeMemberId = 20)

    @Test
    fun `upload rejects file kind that does not belong to owner type before transaction`() {
        val txManager = FakeTransactionManager()
        val service = FileService(txManager, FakeStorage())

        val result =
            service.upload(
                admin,
                input(
                    ownerType = FileOwnerType.USER,
                    ownerId = 1,
                    kind = FileKind.ATHLETE_PHOTO,
                    contentType = "image/png",
                ),
            )

        val error = assertLeft<FileError.Validation>(result)
        assertContains(error.message, "athlete files")
        assertEquals(0, txManager.runs)
    }

    @Test
    fun `upload rejects unsupported type empty file and overlarge photo before transaction`() {
        val service = FileService(FakeTransactionManager(), FakeStorage())

        assertIs<FileError.Validation>(
            assertLeft(
                service.upload(
                    admin,
                    input(contentType = "text/plain", bytes = byteArrayOf(1)),
                ),
            ),
        )
        assertIs<FileError.Validation>(
            assertLeft(
                service.upload(
                    admin,
                    input(contentType = "image/png", bytes = byteArrayOf()),
                ),
            ),
        )
        assertIs<FileError.Validation>(
            assertLeft(
                service.upload(
                    admin,
                    input(contentType = "image/png", bytes = ByteArray(5 * 1024 * 1024 + 1)),
                ),
            ),
        )
    }

    @Test
    fun `normal user uploads own profile photo and storage key is sanitized`() {
        val files = FakeFileRepository()
        val storage = FakeStorage()
        val service = FileService(FakeTransactionManager(FakeTransaction(fileRepository = files)), storage)

        val result =
            service.upload(
                normal,
                input(
                    ownerType = FileOwnerType.USER,
                    ownerId = normal.userId,
                    kind = FileKind.USER_PROFILE_PHOTO,
                    originalName = " my photo!.png ",
                    contentType = "image/png",
                    bytes = byteArrayOf(7, 8, 9),
                ),
            )

        val stored = assertRight(result)
        assertEquals(1, stored.fileId)
        assertEquals(" my photo!.png ", stored.originalName)
        assertEquals(1, files.saved.size)
        assertEquals(1, storage.puts.size)
        assertContains(storage.puts.single().key, "user/10/user_profile_photo/")
        assertTrue(storage.puts.single().key.endsWith("-my_photo_.png"))
    }

    @Test
    fun `upload uses default filename when original name is blank`() {
        val service = FileService(FakeTransactionManager(FakeTransaction()), FakeStorage())

        val stored =
            assertRight(
                service.upload(
                    admin,
                    input(
                        ownerType = FileOwnerType.ATHLETE,
                        ownerId = 30,
                        kind = FileKind.ATHLETE_ID_CARD,
                        originalName = "   ",
                        contentType = "application/pdf",
                    ),
                ),
            )

        assertEquals("athlete_id_card.pdf", stored.originalName)
    }

    @Test
    fun `upload athlete photo updates athlete photo url and removes previous files`() {
        val previous =
            storedFile(
                fileId = 9,
                ownerType = FileOwnerType.ATHLETE,
                ownerId = 30,
                kind = FileKind.ATHLETE_PHOTO,
                storageKey = "old/photo.png",
            )
        val files = FakeFileRepository(existingByOwner = mutableListOf(previous))
        val athletes = FakeAthleteRepository(athletes = mutableMapOf(30L to sampleAthlete(30, memberId = 20)))
        val storage = FakeStorage()
        val service =
            FileService(
                FakeTransactionManager(FakeTransaction(fileRepository = files, athleteRepository = athletes)),
                storage,
            )

        val stored =
            assertRight(
                service.upload(
                    admin,
                    input(ownerType = FileOwnerType.ATHLETE, ownerId = 30, kind = FileKind.ATHLETE_PHOTO),
                ),
            )

        assertEquals("/api/files/${stored.fileId}/public-athlete-photo", athletes.updated.single().photoUrl)
        assertEquals(listOf(9L), files.deleted)
        assertEquals(listOf("old/photo.png"), storage.deletes)
    }

    @Test
    fun `list denies normal user when owner member is unrelated`() {
        val tx =
            FakeTransaction(
                memberRepository =
                    FakeMemberRepository(
                        members = mutableMapOf(99L to sampleMember(memberId = 99, userId = 123)),
                    ),
            )
        val service = FileService(FakeTransactionManager(tx), FakeStorage())

        val result = service.list(normal, FileOwnerType.MEMBER, 99, null)

        val error = assertLeft<FileError.Unauthorized>(result)
        assertContains(error.message, "not allowed")
    }

    @Test
    fun `get content returns file and storage object when user can access owner`() {
        val file = storedFile(fileId = 5, ownerType = FileOwnerType.USER, ownerId = normal.userId)
        val storage = FakeStorage(objects = mutableMapOf(file.storageKey to FileObject(byteArrayOf(1, 2), "image/png")))
        val service =
            FileService(
                FakeTransactionManager(FakeTransaction(fileRepository = FakeFileRepository(files = mutableMapOf(5L to file)))),
                storage,
            )

        val (stored, obj) = assertRight(service.getContent(normal, 5))

        assertEquals(file, stored)
        assertEquals("image/png", obj.contentType)
        assertEquals(listOf(file.storageKey), storage.gets)
    }

    @Test
    fun `public athlete photo rejects missing files and non photo files`() {
        val document = storedFile(fileId = 2, kind = FileKind.ATHLETE_ID_CARD)
        val service =
            FileService(
                FakeTransactionManager(FakeTransaction(fileRepository = FakeFileRepository(files = mutableMapOf(2L to document)))),
                FakeStorage(),
            )

        assertIs<FileError.NotFound>(assertLeft(service.getPublicAthletePhoto(1)))
        assertIs<FileError.Unauthorized>(assertLeft(service.getPublicAthletePhoto(2)))
    }

    @Test
    fun `delete athlete photo clears athlete photo url and deletes object`() {
        val file = storedFile(fileId = 6, ownerType = FileOwnerType.ATHLETE, ownerId = 30, kind = FileKind.ATHLETE_PHOTO)
        val files = FakeFileRepository(files = mutableMapOf(6L to file))
        val athletes =
            FakeAthleteRepository(
                athletes = mutableMapOf(30L to sampleAthlete(30, memberId = 20).copy(photoUrl = "/api/files/6/public-athlete-photo")),
            )
        val storage = FakeStorage()
        val service =
            FileService(
                FakeTransactionManager(FakeTransaction(fileRepository = files, athleteRepository = athletes)),
                storage,
            )

        assertRight(service.delete(admin, 6))

        assertEquals(listOf(6L), files.deleted)
        assertNull(athletes.updated.single().photoUrl)
        assertEquals(listOf(file.storageKey), storage.deletes)
    }

    private fun input(
        ownerType: FileOwnerType = FileOwnerType.USER,
        ownerId: Long = 1,
        kind: FileKind = FileKind.USER_PROFILE_PHOTO,
        originalName: String = "file.png",
        contentType: String = "image/png",
        bytes: ByteArray = byteArrayOf(1, 2, 3),
    ) = FileUploadInput(ownerType, ownerId, kind, originalName, contentType, bytes)

    private fun auth(
        role: Role,
        userId: Long,
        activeMemberId: Long? = null,
    ) = AuthenticatedUser(userId, "u$userId@example.test", "u$userId", role, activeMemberId, "token-$userId")

    private fun sampleMember(
        memberId: Long,
        userId: Long?,
    ) = Member(
        memberId = memberId,
        userId = userId,
        memberNumber = memberId.toInt(),
        completeName = "Member $memberId",
        birthDate = LocalDate.parse("2000-01-01"),
        birthplace = null,
        email = "m$memberId@example.test",
        phone = "912345678",
        homePhone = null,
        address = "Rua",
        postalCode = "1000-001",
        city = "Lisboa",
        nif = "123456789",
        category = MemberCategory.SOCIO,
        formerMember = false,
        status = MemberStatus.ATIVO,
        membershipQuota = 150,
        billingLocation = null,
        registrationDate = LocalDate.parse("2025-01-01"),
        approvalDate = LocalDate.parse("2025-01-02"),
        privacyAccepted = true,
        comsAccepted = false,
    )

    private fun sampleAthlete(
        athleteId: Long,
        memberId: Long,
    ) = Athlete(
        athleteId = athleteId,
        memberId = memberId,
        nationality = "Portuguesa",
        niss = "11122233301",
        numeroUtente = "300003001",
        bi = "CC30001",
        biExpirationDate = LocalDate.parse("2030-05-01"),
        school = null,
        schoolYear = null,
        schoolClass = null,
        lastClub = null,
        season = "2025/2026",
        teamCategory = TeamCategory(1, 1, "SENIORES", "Seniores", true, 1),
    )

    private fun storedFile(
        fileId: Long = 1,
        ownerType: FileOwnerType = FileOwnerType.USER,
        ownerId: Long = 1,
        kind: FileKind = FileKind.USER_PROFILE_PHOTO,
        storageKey: String = "key-$fileId",
    ) = StoredFile(
        fileId = fileId,
        ownerType = ownerType,
        ownerId = ownerId,
        kind = kind,
        originalName = "file.png",
        contentType = "image/png",
        size = 3,
        storageKey = storageKey,
        uploadedAt = Instant.parse("2026-05-01T10:00:00Z"),
        uploadedBy = 1,
    )

    private inline fun <reified E : FileError> assertLeft(result: FileResult<*>): E {
        assertIs<Either.Left<FileError>>(result)
        return assertIs<E>(result.value)
    }

    private fun <T> assertRight(result: FileResult<T>): T {
        assertIs<Either.Right<T>>(result)
        return result.value
    }

    private class FakeTransactionManager(
        private val tx: Transaction = FakeTransaction(),
    ) : TransactionManager {
        var runs = 0

        override fun <R> run(block: (Transaction) -> R): R {
            runs++
            return block(tx)
        }
    }

    private class FakeTransaction(
        override val memberRepository: MemberRepository = FakeMemberRepository(),
        override val athleteRepository: AthleteRepository = FakeAthleteRepository(),
        override val fileRepository: FileRepository = FakeFileRepository(),
    ) : Transaction {
        override val userRepository: UserRepository get() = unsupported()
        override val eventRepository: EventRepository get() = unsupported()
        override val ticketRepository: TicketRepository get() = unsupported()
        override val chargeRepository: ChargeRepository get() = unsupported()
        override val chargeItemRepository: ChargeItemRepository get() = unsupported()
        override val paymentRepository: PaymentRepository get() = unsupported()
        override val sponsorRepository: SponsorRepository get() = unsupported()
        override val sponsorshipRepository: SponsorshipRepository get() = unsupported()
        override val equipmentPlacementRepository: EquipmentPlacementRepository get() = unsupported()
        override val otherSportRepository: OtherSportRepository get() = unsupported()
        override val pubOptionRepository: PubOptionRepository get() = unsupported()
        override val teamCategoryRepository: TeamCategoryRepository get() = unsupported()
        override val teamCategoryPriceOverrideRepository: TeamCategoryPriceOverrideRepository get() = unsupported()
        override val teamGroupPriceRepository: TeamGroupPriceRepository get() = unsupported()
        override val teamGroupRepository: TeamGroupRepository get() = unsupported()
        override val trainingScheduleRepository: TrainingScheduleRepository get() = unsupported()
        override val seasonRepository: SeasonRepository get() = unsupported()
        override val emailNotificationLogRepository: EmailNotificationLogRepository get() = unsupported()

        private fun <T> unsupported(): T = throw AssertionError("Repository should not be used in this test")
    }

    private class FakeStorage(
        private val objects: MutableMap<String, FileObject> = mutableMapOf(),
    ) : FileStorage {
        data class Put(
            val key: String,
            val bytes: ByteArray,
            val contentType: String,
        )

        val puts = mutableListOf<Put>()
        val gets = mutableListOf<String>()
        val deletes = mutableListOf<String>()

        override fun put(
            key: String,
            bytes: ByteArray,
            contentType: String,
        ) {
            puts += Put(key, bytes, contentType)
            objects[key] = FileObject(bytes, contentType)
        }

        override fun get(key: String): FileObject {
            gets += key
            return objects.getValue(key)
        }

        override fun delete(key: String) {
            deletes += key
            objects.remove(key)
        }
    }

    private class FakeFileRepository(
        private val files: MutableMap<Long, StoredFile> = mutableMapOf(),
        private val existingByOwner: MutableList<StoredFile> = mutableListOf(),
    ) : FileRepository {
        val saved = mutableListOf<StoredFile>()
        val deleted = mutableListOf<Long>()
        private var nextId = 1L

        override fun save(file: StoredFile): Long {
            val id = nextId++
            saved += file
            files[id] = file.copy(fileId = id)
            return id
        }

        override fun findById(fileId: Long): StoredFile? = files[fileId]

        override fun findByOwner(
            ownerType: FileOwnerType,
            ownerId: Long,
            kind: FileKind?,
        ): List<StoredFile> =
            (existingByOwner + files.values).filter {
                it.ownerType == ownerType && it.ownerId == ownerId && (kind == null || it.kind == kind)
            }

        override fun delete(fileId: Long) {
            deleted += fileId
            files.remove(fileId)
        }
    }

    private class FakeMemberRepository(
        private val members: MutableMap<Long, Member> = mutableMapOf(),
    ) : MemberRepository {
        override fun findById(id: Long): Member? = members[id]
        override fun save(member: Member): Long = unsupported()
        override fun update(member: Member) {
            throw AssertionError("MemberRepository method should not be used")
        }
        override fun findByIds(ids: List<Long>): List<Member> = unsupported()
        override fun findByEmail(email: String): Member? = unsupported()
        override fun findByMemberNumber(memberNumber: Int): Member? = unsupported()
        override fun findAll(): List<Member> = unsupported()
        override fun findPage(limit: Int, offset: Int): List<Member> = unsupported()
        override fun countAll(): Long = unsupported()
        override fun countByStatus(status: MemberStatus): Long = unsupported()
        override fun findPageFiltered(
            limit: Int,
            offset: Int,
            search: String?,
            category: MemberCategory?,
            status: MemberStatus?,
        ): List<Member> = unsupported()

        override fun countFiltered(
            search: String?,
            category: MemberCategory?,
            status: MemberStatus?,
        ): Long = unsupported()

        override fun findAllActive(): List<Member> = unsupported()
        override fun nextMemberNumber(): Int = unsupported()
        private fun <T> unsupported(): T = throw AssertionError("MemberRepository method should not be used")
    }

    private class FakeAthleteRepository(
        private val athletes: MutableMap<Long, Athlete> = mutableMapOf(),
    ) : AthleteRepository {
        val updated = mutableListOf<Athlete>()

        override fun findById(id: Long): Athlete? = athletes[id]

        override fun update(athlete: Athlete) {
            updated += athlete
            athletes[athlete.athleteId] = athlete
        }

        override fun findByMemberId(memberId: Long): Athlete? = unsupported()
        override fun findAllActive(): List<Athlete> = unsupported()
        override fun findAll(): List<Athlete> = unsupported()
        override fun findPage(limit: Int, offset: Int): List<Athlete> = unsupported()
        override fun countAll(): Long = unsupported()
        override fun countByStatus(status: AthleteStatus): Long = unsupported()
        override fun findPageFiltered(
            limit: Int,
            offset: Int,
            search: String?,
            teamCategoryIds: List<Long>,
            statuses: List<AthleteStatus>,
        ): List<Athlete> = unsupported()

        override fun countFiltered(
            search: String?,
            teamCategoryIds: List<Long>,
            statuses: List<AthleteStatus>,
        ): Long = unsupported()

        override fun findByTeamCategory(
            teamCategoryId: Long,
            activeOnly: Boolean,
        ): List<Athlete> = unsupported()

        override fun findByIdWithDetail(id: Long): Athlete? = unsupported()
        override fun save(athlete: Athlete): Long = unsupported()
        override fun saveGuardians(
            athleteId: Long,
            guardians: List<Guardian>,
        ) {
            throw AssertionError("AthleteRepository method should not be used")
        }

        override fun deleteGuardiansByAthleteId(athleteId: Long) {
            throw AssertionError("AthleteRepository method should not be used")
        }
        private fun <T> unsupported(): T = throw AssertionError("AthleteRepository method should not be used")
    }
}
