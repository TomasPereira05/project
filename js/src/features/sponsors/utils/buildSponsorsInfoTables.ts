import type { CatalogSnapshot } from "../types";
import { resolveTeamSponsorshipPrice } from "./teamPricing";

type SponsorInfoColumn = {
  id: string;
  label: string;
  resolvePrice: (placementId: number) => number | null;
};

export function buildSponsorPubRows(catalogs: CatalogSnapshot) {
  return catalogs.pubOptions
    .map((option) => ({
      id: option.pubId,
      label: option.label,
      code: option.code,
      price: option.price,
      available: option.available,
      free: option.free,
      occupied: option.occupied,
    }))
    .filter((row) => row.price != null);
}

export function buildSponsorOtherRows(catalogs: CatalogSnapshot) {
  return catalogs.otherSports
    .map((sport) => ({
      id: sport.sportId,
      label: sport.label,
      code: sport.code,
      price: sport.price,
    }))
    .filter((row) => row.price != null);
}

export function buildSponsorTeamColumns(catalogs: CatalogSnapshot): SponsorInfoColumn[] {
  const publicGroupCodes = new Set(["FUT11", "FUT9", "FUT7"]);
  const groupColumns = catalogs.teamGroups
    .filter((group) => publicGroupCodes.has(group.code.toUpperCase()))
    .filter((group) => catalogs.teamGroupPrices.some((price) => price.teamGroupId === group.teamGroupId))
    .map((group) => ({
      id: `group-${group.teamGroupId}`,
      label: group.label,
      resolvePrice: (placementId: number) =>
        catalogs.teamGroupPrices.find(
          (entry) => entry.teamGroupId === group.teamGroupId && entry.placementId === placementId,
        )?.price ?? null,
    }));

  const overrideColumns = catalogs.teamCategories
    .filter((team) =>
      catalogs.teamCategoryPriceOverrides.some((override) => override.teamCategoryId === team.teamId),
    )
    .map((team) => ({
      id: `team-${team.teamId}`,
      label: team.label,
      resolvePrice: (placementId: number) =>
        resolveTeamSponsorshipPrice(team.teamId, team.teamGroupId, placementId, catalogs),
    }));

  return [...overrideColumns, ...groupColumns];
}

export function buildSponsorTeamMatrix(
  catalogs: CatalogSnapshot,
  teamColumns: SponsorInfoColumn[],
) {
  return catalogs.equipmentPlacements.map((placement) => ({
    placement,
    values: teamColumns.map((column) => ({
      id: column.id,
      label: column.label,
      price: column.resolvePrice(placement.equipmentId),
    })),
  }));
}
