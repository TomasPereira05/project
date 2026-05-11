import type { CatalogSnapshot, TeamCategoryPriceOverride, TeamGroupPrice } from "../types";

export function resolveTeamSponsorshipPrice(
  teamCategoryId: number,
  teamGroupId: number,
  placementId: number,
  prices: Pick<CatalogSnapshot, "teamGroupPrices" | "teamCategoryPriceOverrides"> | {
    teamGroupPrices: TeamGroupPrice[];
    teamCategoryPriceOverrides: TeamCategoryPriceOverride[];
  },
) {
  return (
    prices.teamCategoryPriceOverrides.find(
      (entry) => entry.teamCategoryId === teamCategoryId && entry.placementId === placementId,
    )?.price ??
    prices.teamGroupPrices.find(
      (entry) => entry.teamGroupId === teamGroupId && entry.placementId === placementId,
    )?.price ??
    null
  );
}
