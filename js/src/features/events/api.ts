import { BASE_URL } from "../../shared/config/config";
import { HttpError } from "../../shared/types/HttpError";
import type {
  CheckoutSessionOutput,
  EventCheckoutInput,
  EventInput,
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

export function createEvent(input: EventInput) {
  return request<EventOutput>("/events", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateEvent(eventId: number, input: EventInput) {
  return request<EventOutput>(`/events/${eventId}`, {
    method: "PUT",
    body: JSON.stringify(input),
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
