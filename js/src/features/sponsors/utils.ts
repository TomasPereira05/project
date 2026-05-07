import type {
  EquipmentPlacement,
  OtherSport,
  PubOption,
  SponsorshipStatus,
  SponsorType,
  TeamCategory,
} from "./types";

export function centsFromEuroInput(value: string) {
  const normalized = value.replace(",", ".").trim();
  if (!normalized) {
    return 0;
  }

  const amount = Number.parseFloat(normalized);
  if (Number.isNaN(amount)) {
    throw new Error("Please enter a valid price.");
  }

  return Math.round(amount * 100);
}

export function euroInputFromCents(value: number | null | undefined) {
  if (value == null) {
    return "";
  }

  return (value / 100).toFixed(2);
}

export function formatCurrency(cents: number) {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

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

export function compareBySortOrder<T extends { sortOrder: number | null }>(
  first: T,
  second: T,
) {
  return (first.sortOrder ?? Number.MAX_SAFE_INTEGER) - (second.sortOrder ?? Number.MAX_SAFE_INTEGER);
}

export function moveItem<T>(items: T[], fromIndex: number, toIndex: number) {
  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

export function resolveSponsorshipTarget(
  sponsorship: {
    type: SponsorType;
    pubOptionId: number | null;
    teamCategoryId: number | null;
    placementId: number | null;
    sportId: number | null;
  },
  catalogs: {
    pubOptions: PubOption[];
    teamCategories: TeamCategory[];
    equipmentPlacements: EquipmentPlacement[];
    otherSports: OtherSport[];
  },
) {
  if (sponsorship.type === "PUB") {
    const option = catalogs.pubOptions.find((item) => item.pubId === sponsorship.pubOptionId);
    return option ? option.label : "Unknown pub option";
  }

  if (sponsorship.type === "TEAM") {
    const team = catalogs.teamCategories.find((item) => item.teamId === sponsorship.teamCategoryId);
    const placement = catalogs.equipmentPlacements.find((item) => item.equipmentId === sponsorship.placementId);
    return [team?.label, placement?.label].filter(Boolean).join(" / ") || "Unknown team placement";
  }

  const sport = catalogs.otherSports.find((item) => item.sportId === sponsorship.sportId);
  return sport ? sport.label : "Unknown sport";
}
