package pt.isel.jagoz.http.utils

import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.http.converter.HttpMessageNotReadableException
import org.springframework.web.ErrorResponse
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice

/**
 * Converte as falhas que acontecem antes de o pedido chegar ao controller para o formato
 * `Problem` (application/problem+json) usado no resto da API — sem isto, o Spring devolve
 * o corpo de erro default dele, num formato diferente de todos os outros erros.
 */
@RestControllerAdvice
class ValidationExceptionHandler {
    /** Bean Validation falhou (@Valid num @RequestBody): 400 com os campos e a razao. */
    @ExceptionHandler(MethodArgumentNotValidException::class)
    fun handleValidation(ex: MethodArgumentNotValidException): ResponseEntity<Any> {
        val message =
            ex.bindingResult.fieldErrors
                .sortedBy { it.field }
                .joinToString("; ") { "${it.field}: ${it.defaultMessage}" }
                .ifEmpty { "Pedido invalido." }
        return Problem.ValidationError(message).response(HttpStatus.BAD_REQUEST)
    }

    /** JSON malformado, campo obrigatorio em falta ou tipo errado na desserializacao. */
    @ExceptionHandler(HttpMessageNotReadableException::class)
    fun handleUnreadable(ex: HttpMessageNotReadableException): ResponseEntity<Any> =
        Problem
            .ValidationError("Corpo do pedido invalido: JSON malformado ou campo obrigatorio em falta.")
            .response(HttpStatus.BAD_REQUEST)

    /**
     * Rede de seguranca para exceções que nenhum handler previu: sem isto o cliente recebia
     * o corpo de erro default do Spring em vez de um `Problem`. As exceções do proprio
     * Spring MVC (404 de rota inexistente, 405 de metodo nao suportado, ...) ja trazem o
     * status e um corpo problem+json — preserva-os em vez de os mascarar como 500.
     */
    @ExceptionHandler(Exception::class)
    fun handleUnexpected(ex: Exception): ResponseEntity<Any> {
        if (ex is ErrorResponse) {
            return ResponseEntity
                .status(ex.statusCode)
                .header("Content-Type", "application/problem+json")
                .body(ex.body)
        }
        logger.error("Excecao nao tratada a processar o pedido", ex)
        return Problem.UnknownError.response(HttpStatus.INTERNAL_SERVER_ERROR)
    }

    companion object {
        private val logger = LoggerFactory.getLogger(ValidationExceptionHandler::class.java)
    }
}
