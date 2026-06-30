const LISBON = "Europe/Lisbon";

/**
 * Converte um Instant ISO (UTC, "...Z") para o valor de um <input type="datetime-local">
 * em hora de Lisboa: "yyyy-MM-ddTHH:mm". Usado para pré-preencher o formulário de edição.
 */
export function isoToLisbonInput(iso: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: LISBON,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(iso));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

/**
 * Mostra a hora "HH:mm" em Lisboa de um Instant UTC ("...Z") — usado para a hora de validação
 * de um bilhete (usedAt), que o servidor envia como Instant.
 */
export function formatLocalTime(iso: string): string {
  return new Intl.DateTimeFormat("pt-PT", {
    timeZone: LISBON,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

/** Mostra data + hora de um evento em hora de Lisboa para a UI. */
export function formatEventDateTime(iso: string): string {
  return new Intl.DateTimeFormat("pt-PT", {
    timeZone: LISBON,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}
