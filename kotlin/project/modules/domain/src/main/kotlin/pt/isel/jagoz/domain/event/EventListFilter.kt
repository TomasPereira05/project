package pt.isel.jagoz.domain.event

/** Filtro de listagem de eventos para o backoffice (separadores na UI). */
enum class EventListFilter {
    // agendados e futuros (status SCHEDULED, starts_at > agora)
    SCHEDULED,

    // já decorridos mas não cancelados (status SCHEDULED, starts_at <= agora)
    PAST,

    CANCELLED,
    ALL,
}
