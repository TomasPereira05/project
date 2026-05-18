import type { SponsorshipStatus, SponsorType } from "../types";

type Translate = (key: string, options?: Record<string, unknown>) => string;

export function sponsorTypeLabel(type: SponsorType, t: Translate) {
  return t(`sponsors.labels.types.${type}`);
}

export function sponsorshipStatusLabel(status: SponsorshipStatus, t: Translate) {
  return t(`sponsors.labels.statuses.${status}`);
}

export function sponsorshipStatusClass(status: SponsorshipStatus) {
  switch (status) {
    case "SUBMETIDO":
      return "sponsor-badge sponsor-badge-pending";
    case "APROVADO":
      return "sponsor-badge sponsor-badge-approved";
    case "PAGO":
      return "sponsor-badge sponsor-badge-paid";
    case "ATIVO":
      return "sponsor-badge sponsor-badge-paid";
    case "CANCELADO":
      return "sponsor-badge sponsor-badge-cancelled";
  }
}
