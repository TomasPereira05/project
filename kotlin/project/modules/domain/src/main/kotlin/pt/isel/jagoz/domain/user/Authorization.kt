package pt.isel.jagoz.domain.user

fun AuthenticatedUser.canManageBackoffice(): Boolean =
    role == Role.ADMIN || role == Role.SECRETARIA
