package pt.isel.jagoz.http.utils

import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import java.net.URI

private const val MEDIA_TYPE = "application/problem+json"
private const val PROBLEM_URI_PATH = "/problems"

sealed class Problem(
    typeUri: URI,
) {
    val type: String = typeUri.toString()
    val title: String = typeUri.toString().split("/").last()

    fun response(status: HttpStatus): ResponseEntity<Any> =
        ResponseEntity
            .status(status)
            .header("Content-Type", MEDIA_TYPE)
            .body(this)

    data object UnknownError : Problem(URI("${PROBLEM_URI_PATH}/unknown-error")) {
        val description = "Ocorreu um erro inesperado. Tente novamente mais tarde."
    }

    data object MemberNotFound : Problem(URI("${PROBLEM_URI_PATH}/member-not-found")) {
        val description = "Socio nao encontrado."
    }

    data class ValidationError(
        val message: String,
    ) : Problem(URI("${PROBLEM_URI_PATH}/validation-error")) {
        val description = "Erro de validacao."
    }

    data class MemberAlreadyExists(
        val field: String,
        val value: Any,
    ) : Problem(URI("${PROBLEM_URI_PATH}/member-already-exists")) {
        val description = "Socio ja existe."
    }

    data class UserNotFound(
        val field: String,
        val value: Any,
    ) : Problem(URI("${PROBLEM_URI_PATH}/user-not-found")) {
        val description = "Utilizador nao encontrado."
    }

    data class UserAlreadyExists(
        val field: String,
        val value: Any,
    ) : Problem(URI("${PROBLEM_URI_PATH}/user-already-exists")) {
        val description = "Utilizador ja existe."
    }

    data class AthleteNotFound(
        val field: String,
        val value: Any,
    ) : Problem(URI("${PROBLEM_URI_PATH}/athlete-not-found")) {
        val description = "Atleta nao encontrado."
    }

    data class AthleteAlreadyRegistered(
        val userId: Long,
    ) : Problem(URI("${PROBLEM_URI_PATH}/athlete-already-registered")) {
        val description = "Ja existe uma inscricao de atleta associada a esta conta."
    }

    data class TeamCategoryNotFound(
        val teamCategoryId: Long,
    ) : Problem(URI("${PROBLEM_URI_PATH}/team-category-not-found")) {
        val description = "Categoria de equipa nao encontrada."
    }

    data class GuardianMemberNotFound(
        val memberNumber: Int,
    ) : Problem(URI("${PROBLEM_URI_PATH}/guardian-member-not-found")) {
        val description = "Socio indicado como encarregado nao encontrado."
    }

    data class AthleteInvalidStateTransition(
        val athleteId: Long,
        val currentStatus: String,
        val attempted: String,
    ) : Problem(URI("${PROBLEM_URI_PATH}/athlete-invalid-state-transition")) {
        val description = "Operacao incompativel com o estado actual do atleta."
    }

    data class InvalidAthleteDateField(
        val field: String,
        val reason: String,
    ) : Problem(URI("${PROBLEM_URI_PATH}/invalid-athlete-date-field")) {
        val description = "Valor de data invalido na inscricao do atleta."
    }

    data class UserRelatedResourceNotFound(
        val field: String,
        val value: Any,
    ) : Problem(
            URI("${PROBLEM_URI_PATH}/user-related-resource-not-found"),
        ) {
        val description = "Recurso associado ao utilizador nao encontrado."
    }

    data class SponsorNotFound(
        val value: Any,
    ) : Problem(URI("${PROBLEM_URI_PATH}/sponsor-not-found")) {
        val description = "Sponsor nao encontrado."
    }

    data class SponsorshipNotFound(
        val value: Any,
    ) : Problem(URI("${PROBLEM_URI_PATH}/sponsorship-not-found")) {
        val description = "Sponsorship nao encontrado."
    }

    data class Unauthorized(
        val message: String,
    ) : Problem(URI("${PROBLEM_URI_PATH}/unauthorized")) {
        val description = "Autenticacao invalida ou em falta."
    }

    data class InvalidTransition(
        val from: String,
        val attempted: String,
    ) : Problem(URI("${PROBLEM_URI_PATH}/invalid-transition")) {
        val description = "Transicao invalida."
    }

    data class InvalidOperation(
        val operation: String,
        val reason: String,
    ) : Problem(URI("${PROBLEM_URI_PATH}/invalid-operation")) {
        val description = "Operacao invalida."
    }
}
