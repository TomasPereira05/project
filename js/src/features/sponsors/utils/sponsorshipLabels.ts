import type { SponsorshipStatus, SponsorType } from "../types";

export function sponsorTypeLabel(type: SponsorType) {
  switch (type) {
    case "PUB":
      return "Publicidade";
    case "TEAM":
      return "Equipa";
    case "OTHER":
      return "Outra modalidade";
  }
}

export function sponsorshipStatusLabel(status: SponsorshipStatus) {
  switch (status) {
    case "SUBMETIDO":
      return "Submetido";
    case "APROVADO":
      return "Aprovado";
    case "PAGO":
      return "Pago";
    case "ATIVO":
      return "Ativo";
    case "CANCELADO":
      return "Cancelado";
  }
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
