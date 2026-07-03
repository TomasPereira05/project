package pt.isel.jagoz.host.logging

import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import kotlinx.datetime.Clock
import org.slf4j.LoggerFactory
import org.slf4j.MDC
import org.springframework.core.Ordered
import org.springframework.core.annotation.Order
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter
import pt.isel.jagoz.domain.audit.AuditLog
import pt.isel.jagoz.http.pipeline.AuthenticatedUserArgumentResolver
import pt.isel.jagoz.repository.TransactionManager
import java.util.UUID

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
class RequestLoggingFilter(
    private val transactionManager: TransactionManager,
) : OncePerRequestFilter() {
    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain,
    ) {
        val requestId = request.getHeader(REQUEST_ID_HEADER)?.takeIf { it.isNotBlank() } ?: UUID.randomUUID().toString()
        val startedAt = System.nanoTime()
        var thrown: Throwable? = null

        response.setHeader(REQUEST_ID_HEADER, requestId)
        MDC.put("requestId", requestId)

        try {
            LOG.info("request.start method={} path={} ip={}", request.method, request.requestURI, clientIp(request))
            filterChain.doFilter(request, response)
        } catch (error: Throwable) {
            thrown = error
            throw error
        } finally {
            val durationMs = (System.nanoTime() - startedAt) / 1_000_000
            val status = if (thrown != null && response.status < 500) 500 else response.status
            val user = AuthenticatedUserArgumentResolver.getUserFrom(request)

            LOG.info(
                "request.end method={} path={} status={} durationMs={} userId={}",
                request.method,
                request.requestURI,
                status,
                durationMs,
                user?.userId,
            )

            if (shouldAudit(request)) {
                saveAuditLogSafely(
                    AuditLog(
                        auditLogId = 0,
                        occurredAt = Clock.System.now(),
                        requestId = requestId,
                        userId = user?.userId,
                        username = user?.username,
                        role = user?.role,
                        action = actionFor(request),
                        method = request.method,
                        path = truncate(request.requestURI, 600) ?: request.requestURI,
                        queryString = truncate(request.queryString, 1000),
                        statusCode = status,
                        durationMs = durationMs,
                        ipAddress = truncate(clientIp(request), 80),
                        userAgent = truncate(request.getHeader("User-Agent"), 500),
                        outcome = if (status < 400) "SUCCESS" else "FAILURE",
                        targetType = targetType(request),
                        targetId = targetId(request),
                        errorMessage = truncate(thrown?.message, 1000),
                    ),
                )
            }

            MDC.remove("requestId")
        }
    }

    private fun saveAuditLogSafely(auditLog: AuditLog) {
        runCatching {
            transactionManager.run { transaction ->
                transaction.auditLogRepository.save(auditLog)
            }
        }.onFailure { error ->
            LOG.error("audit.save.failed requestId={} error={}", auditLog.requestId, error.message, error)
        }
    }

    private fun shouldAudit(request: HttpServletRequest): Boolean =
        request.requestURI.startsWith("/api/") &&
            request.method.uppercase() in AUDITED_METHODS

    private fun actionFor(request: HttpServletRequest): String =
        "${request.method.uppercase()}_${targetType(request)?.uppercase() ?: "API"}"

    private fun targetType(request: HttpServletRequest): String? =
        pathSegments(request)
            .firstOrNull()
            ?.replace("-", "_")

    private fun targetId(request: HttpServletRequest): String? =
        pathSegments(request)
            .drop(1)
            .firstOrNull { segment -> segment.any { it.isDigit() } }
            ?.let { truncate(it, 120) }

    private fun pathSegments(request: HttpServletRequest): List<String> =
        request.requestURI
            .removePrefix("/api")
            .split("/")
            .filter { it.isNotBlank() }

    private fun clientIp(request: HttpServletRequest): String =
        request
            .getHeader("X-Forwarded-For")
            ?.split(",")
            ?.firstOrNull()
            ?.trim()
            ?.takeIf { it.isNotBlank() }
            ?: request.remoteAddr

    private fun truncate(
        value: String?,
        maxLength: Int,
    ): String? =
        value
            ?.takeIf { it.isNotBlank() }
            ?.let { if (it.length <= maxLength) it else it.take(maxLength) }

    private companion object {
        private const val REQUEST_ID_HEADER = "X-Request-Id"
        private val AUDITED_METHODS = setOf("POST", "PUT", "PATCH", "DELETE")
        private val LOG = LoggerFactory.getLogger(RequestLoggingFilter::class.java)
    }
}
