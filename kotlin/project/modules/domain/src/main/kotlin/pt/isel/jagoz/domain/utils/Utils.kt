package pt.isel.jagoz.domain.utils

import kotlinx.datetime.LocalDate

/** Minimum allowed birthdate for validation purposes. */
val MIN_BIRTH_DATE = LocalDate.parse("1900-01-01")

/** Maximum allowed registration date for validation purposes. */
val MAX_REGISTRATION_DATE = LocalDate.parse("9999-12-31")

// Membership quota constants (in cents)

/** Quota mensal por defeito de um atleta - 2000 cêntimos (20,00€). Editável por atleta (admin). */
const val ATHLETE_MEMBER_QUOTA = 2000

/** Minimum membership quota for regular members - 150 cents (1.50â‚¬). */
const val REGULAR_MEMBER_MIN_QUOTA = 150
