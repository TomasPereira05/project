import { euroInputFromCents } from "../../../shared/utils";
import type { TeamCategoryPriceOverride, TeamGroupPrice } from "../types";

export type CatalogEditor = {
  code: string;
  label: string;
  available?: string;
  price?: string;
};

export type CatalogKind = "pub" | "placement" | "sport";

export const initialCatalogDrafts: Record<CatalogKind, CatalogEditor> = {
  pub: { code: "", label: "", available: "0", price: "0.00" },
  placement: { code: "", label: "" },
  sport: { code: "", label: "", price: "0.00" },
};

export function createEmptyCatalogDraft(kind: CatalogKind): CatalogEditor {
  if (kind === "pub") return { code: "", label: "", available: "0", price: "0.00" };
  if (kind === "sport") return { code: "", label: "", price: "0.00" };
  return { code: "", label: "" };
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

export function isValidPubCapacity(available: number) {
  return Number.isInteger(available) && available >= 0;
}
