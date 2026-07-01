export type EventStatus = "SCHEDULED" | "CANCELLED";
export type TicketPriceType = "NORMAL" | "MEMBER";
export type TicketStatus = "RESERVED" | "CONFIRMED" | "CANCELLED" | "USED";
export type EventStatusFilter = "scheduled" | "past" | "cancelled" | "all";

export type SectorOutput = {
  sectorId: number;
  name: string;
  capacity: number;
  occupied: number;
  available: number;
};

export type EventOutput = {
  eventId: number;
  name: string;
  description: string;
  // ISO-8601 (UTC); formatar em Europe/Lisbon na UI
  startsAt: string;
  location: string;
  status: EventStatus;
  // cêntimos
  priceNormal: number;
  priceMember: number;
  capacityTotal: number;
  sectors: SectorOutput[];
};

export type EventTicketOutput = {
  ticketId: number;
  buyerName: string;
  buyerEmail: string;
  sectorName: string;
  priceType: TicketPriceType;
  price: number;
  status: TicketStatus;
  qrCode: string | null;
  usedAt: string | null;
};

// ---- valores de formulário (strings nos inputs) ----

export type SectorFormValue = {
  sectorId: number | null; // null = setor novo
  name: string;
  capacity: string;
  occupied: number; // só leitura, vem do backend nos setores existentes
};

export type EventFormValues = {
  name: string;
  description: string;
  // valor local de <input datetime-local>, ex.: "2027-01-01T20:00" (interpretado em Lisboa no servidor)
  startsAt: string;
  location: string;
  // euros (string) — convertidos para cêntimos no envio
  priceNormal: string;
  priceMember: string;
  sectors: SectorFormValue[];
};

// ---- payload de criação/edição (form values já normalizados para o servidor) ----

export type SectorInput = {
  sectorId: number | null; // null = setor novo
  name: string;
  capacity: number;
};

export type EventInput = {
  name: string;
  description: string;
  // string local ("...:00"); o servidor interpreta em Europe/Lisbon
  startsAt: string;
  location: string;
  // cêntimos
  priceNormal: number;
  priceMember: number;
  sectors: SectorInput[];
};

// ---- compra de bilhetes (público) ----

export type TicketLineInput = {
  sectorId: number;
  priceType: TicketPriceType;
  // só para MEMBER em compra anónima; autenticado resolve pela sessão
  memberNumber?: number;
  memberBirthDate?: string; // "yyyy-MM-dd"
};

export type EventCheckoutInput = {
  buyerName: string;
  buyerEmail: string;
  lines: TicketLineInput[];
};

export type CheckoutSessionOutput = {
  paymentId: number;
  chargeId: number;
  sessionId: string;
  checkoutUrl: string;
};

export type TicketValidationOutcome =
  | "VALID"
  | "ALREADY_USED"
  | "WRONG_EVENT"
  | "OUTSIDE_WINDOW"
  | "CANCELLED"
  | "INVALID";

export type TicketValidationOutput = {
  outcome: TicketValidationOutcome;
  ticket: EventTicketOutput | null;
};
