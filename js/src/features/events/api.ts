import { BASE_URL } from "../../shared/config/config";
import { HttpError } from "../../shared/types/HttpError";
import { centsFromEuroInput } from "../../shared/utils";
import type {
  CheckoutSessionOutput,
  EventCheckoutInput,
  EventFormValues,
  EventOutput,
  EventStatusFilter,
  EventTicketOutput,
  TicketValidationOutput,
} from "./types";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    credentials: "include",
    ...init,
  });

  if (!response.ok) {
    throw await HttpError.fromResponse(response);
  }

  if (response.status === 204) {
    return {} as T;
  }

  const text = await response.text();
  if (!text) {
    return {} as T;
  }

  return JSON.parse(text) as T;
}

// <input type="datetime-local"> dá "yyyy-MM-ddTHH:mm" (sem segundos); o parser do
// servidor (kotlinx LocalDateTime) exige segundos. Normalizamos para "...:00".
function ensureSeconds(local: string): string {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local) ? `${local}:00` : local;
}

function toBody(values: EventFormValues) {
  return {
    name: values.name.trim(),
    description: values.description.trim(),
    // string local; o servidor interpreta em Europe/Lisbon
    startsAt: ensureSeconds(values.startsAt),
    location: values.location.trim(),
    priceNormal: centsFromEuroInput(values.priceNormal),
    priceMember: centsFromEuroInput(values.priceMember),
    sectors: values.sectors.map((sector) => ({
      sectorId: sector.sectorId,
      name: sector.name.trim(),
      capacity: Number.parseInt(sector.capacity, 10) || 0,
    })),
  };
}

export function fetchEvents(status: EventStatusFilter = "all") {
  const search = new URLSearchParams({ status });
  return request<EventOutput[]>(`/events?${search.toString()}`);
}

/** Eventos disponíveis para compra (público, anónimo). */
export function fetchAvailableEvents() {
  return request<EventOutput[]>("/events/available");
}

export function fetchEvent(eventId: number) {
  return request<EventOutput>(`/events/${eventId}`);
}

export function createEvent(values: EventFormValues) {
  return request<EventOutput>("/events", {
    method: "POST",
    body: JSON.stringify(toBody(values)),
  });
}

export function updateEvent(eventId: number, values: EventFormValues) {
  return request<EventOutput>(`/events/${eventId}`, {
    method: "PUT",
    body: JSON.stringify(toBody(values)),
  });
}

export function cancelEvent(eventId: number) {
  return request<void>(`/events/${eventId}/cancel`, {
    method: "POST",
  });
}

export function fetchEventTickets(eventId: number) {
  return request<EventTicketOutput[]>(`/events/${eventId}/tickets`);
}

/** Inicia a compra de bilhetes (público/anónimo). Devolve a sessão Stripe para redirect. */
export function startTicketCheckout(eventId: number, body: EventCheckoutInput) {
  return request<CheckoutSessionOutput>(`/events/${eventId}/checkout`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/** Valida credenciais de sócio (nº + data de nascimento) antes de avançar no wizard. */
export function validateMemberCredential(memberNumber: number, memberBirthDate: string) {
  return request<{ valid: boolean }>("/events/validate-member", {
    method: "POST",
    body: JSON.stringify({ memberNumber, memberBirthDate }),
  });
}

/** Valida um bilhete à porta a partir do token lido do QR (backoffice). Consome-o se válido. */
export function validateTicket(eventId: number, token: string) {
  return request<TicketValidationOutput>(`/events/${eventId}/tickets/validate`, {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}
