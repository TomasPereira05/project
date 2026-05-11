import { euroInputFromCents } from "../../../shared/utils";
import type { OtherSportPrice, PubOptionPrice, TeamCategoryPriceOverride, TeamGroupPrice } from "../types";

export type CatalogEditor = {
  code: string;
  label: string;
  available?: string;
  free?: string;
  occupied?: string;
};

export type CatalogKind = "pub" | "placement" | "sport";

export const initialCatalogDrafts: Record<CatalogKind, CatalogEditor> = {
  pub: { code: "", label: "", available: "0", free: "0", occupied: "0" },
  placement: { code: "", label: "" },
  sport: { code: "", label: "" },
};

export function createEmptyCatalogDraft(kind: CatalogKind): CatalogEditor {
  return kind === "pub" ? { code: "", label: "", available: "0", free: "0", occupied: "0" } : { code: "", label: "" };
}

export function buildPubPriceDrafts(prices: PubOptionPrice[]) {
  return Object.fromEntries(prices.map((item) => [item.pubOptionId, euroInputFromCents(item.price)]));
}

export function buildOtherSportPriceDrafts(prices: OtherSportPrice[]) {
  return Object.fromEntries(prices.map((item) => [item.sportId, euroInputFromCents(item.price)]));
}

export function buildTeamGroupPriceDrafts(prices: TeamGroupPrice[]) {
  return Object.fromEntries(prices.map((item) => [`${item.teamGroupId}-${item.placementId}`, euroInputFromCents(item.price)]));
}

export function buildTeamOverridePriceDrafts(prices: TeamCategoryPriceOverride[]) {
  return Object.fromEntries(
    prices.map((item) => [
      `${item.teamCategoryId}-${item.placementId}`,
      euroInputFromCents(item.price),
    ]),
  );
}

export function parseCatalogCount(value: string | undefined) {
  return Number.parseInt(value ?? "0", 10);
}

export function isValidPubCapacity(available: number, free: number, occupied: number) {
  return Number.isInteger(available) && Number.isInteger(free) && Number.isInteger(occupied) &&
    available >= 0 && free >= 0 && occupied >= 0 && free + occupied <= available;
}
