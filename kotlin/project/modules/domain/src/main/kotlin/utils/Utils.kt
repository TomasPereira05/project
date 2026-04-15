package pt.isel.jagoz.utils

import kotlinx.datetime.LocalDate

/** Minimum allowed birthdate for validation purposes. */
val MIN_BIRTH_DATE = LocalDate.parse("1900-01-01")

/** Maximum allowed registration date for validation purposes. */
val MAX_REGISTRATION_DATE = LocalDate.parse("9999-12-31")

// Membership quota constants (in cents)

/** Membership quota for athlete members - 0 cents (athletes don't pay membership fee). */
const val ATHLETE_MEMBER_QUOTA = 0

/** Minimum membership quota for regular members - 150 cents (1.50€). */
const val REGULAR_MEMBER_MIN_QUOTA = 150
