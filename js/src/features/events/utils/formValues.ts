import { centsFromEuroInput, euroInputFromCents } from "../../../shared/utils";
import type { EventFormValues, EventInput, EventOutput } from "../types";
import { isoToLisbonInput } from "./datetime";

export function emptyForm(): EventFormValues {
  return {
    name: "",
    description: "",
    startsAt: "",
    location: "",
    priceNormal: "",
    priceMember: "",
    sectors: [{ sectorId: null, name: "", capacity: "", occupied: 0 }],
  };
}

export function toFormValues(event: EventOutput): EventFormValues {
  return {
    name: event.name,
    description: event.description,
    startsAt: isoToLisbonInput(event.startsAt),
    location: event.location,
    priceNormal: euroInputFromCents(event.priceNormal),
    priceMember: euroInputFromCents(event.priceMember),
    sectors: event.sectors.map((sector) => ({
      sectorId: sector.sectorId,
      name: sector.name,
      capacity: String(sector.capacity),
      occupied: sector.occupied,
    })),
  };
}

/** Converte euros (string do input) para cêntimos; -1 sinaliza valor inválido. */
export function safeCents(value: string): number {
  try {
    return centsFromEuroInput(value);
  } catch {
    return -1;
  }
}

// <input type="datetime-local"> dá "yyyy-MM-ddTHH:mm" (sem segundos); o parser do
// servidor (kotlinx LocalDateTime) exige segundos. Normalizamos para "...:00".
function ensureSeconds(local: string): string {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local) ? `${local}:00` : local;
}

/** Mapeia os valores do formulário para o payload aceite pelo servidor. */
export function toEventInput(values: EventFormValues): EventInput {
  return {
    name: values.name.trim(),
    description: values.description.trim(),
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
