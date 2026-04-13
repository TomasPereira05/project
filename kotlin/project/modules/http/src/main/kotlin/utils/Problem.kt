package pt.isel.jagoz.http.utils

import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import java.net.URI

private const val MEDIA_TYPE = "application/problem+json"
private const val PROBLEM_URI_PATH = "/problems"

sealed class Problem(typeUri: URI) {
    val type: String = typeUri.toString()
    val title: String = typeUri.toString().split("/").last()

    fun response(status: HttpStatus): ResponseEntity<Any> =
        ResponseEntity.status(status)
            .header("Content-Type", MEDIA_TYPE)
            .body(this)

    data object MemberNotFound : Problem(URI("${PROBLEM_URI_PATH}/member-not-found")) {
        val description = "Sócio não encontrado."
    }

    data class ValidationError(val message: String) : Problem(URI("${PROBLEM_URI_PATH}/validation-error")) {
        val description = "Erro de validação."
    }

    data class MemberAlreadyExists(val field: String, val value: Any) : Problem(URI("${PROBLEM_URI_PATH}/member-already-exists")) {
        val description = "Sócio já existe."
    }

    data class InvalidTransition(val from: String, val attempted: String) : Problem(URI("${PROBLEM_URI_PATH}/invalid-transition")) {
        val description = "Transição inválida."
    }

    data class InvalidOperation(val operation: String, val reason: String) : Problem(URI("${PROBLEM_URI_PATH}/invalid-operation")) {
        val description = "Operação inválida."
    }
}
