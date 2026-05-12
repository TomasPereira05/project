import type { CatalogSnapshot } from "../types";
import { compareBySortOrder } from "../../../shared/utils";

export const emptySponsorCatalogs: CatalogSnapshot = {
  pubOptions: [],
  teamGroups: [],
  teamCategories: [],
  equipmentPlacements: [],
  otherSports: [],
  pubOptionPrices: [],
  teamGroupPrices: [],
  teamCategoryPriceOverrides: [],
  otherSportPrices: [],
};

export function sortSponsorCatalogs(catalogs: CatalogSnapshot): CatalogSnapshot {
  return {
    ...catalogs,
    pubOptions: [...catalogs.pubOptions].sort(compareBySortOrder),
    teamGroups: [...catalogs.teamGroups].sort(compareBySortOrder),
    teamCategories: [...catalogs.teamCategories].sort(compareBySortOrder),
    equipmentPlacements: [...catalogs.equipmentPlacements].sort(compareBySortOrder),
    otherSports: [...catalogs.otherSports].sort(compareBySortOrder),
  };
}
