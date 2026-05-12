import type { CatalogSnapshot } from "../types";
import { resolveTeamSponsorshipPrice } from "./teamPricing";

export function buildPubSponsorshipCards(catalogs: CatalogSnapshot) {
  return catalogs.pubOptions
    .map((item) => ({
      key: `PUB-${item.pubId}`,
      type: "PUB" as const,
      title: item.label,
      description: item.label,
      price: item.price,
      free: item.free,
      pubOptionId: item.pubId,
    }))
    .filter((item) => item.price != null && item.free > 0);
}

export function buildTeamSponsorshipGroups(catalogs: CatalogSnapshot) {
  return catalogs.teamCategories
    .map((team) => ({
      team,
      options: catalogs.equipmentPlacements
        .map((placement) => ({
          key: `TEAM-${team.teamId}-${placement.equipmentId}`,
          type: "TEAM" as const,
          title: placement.label,
          description: `${team.label} / ${placement.label}`,
          price: resolveTeamSponsorshipPrice(team.teamId, team.teamGroupId, placement.equipmentId, catalogs),
          teamCategoryId: team.teamId,
          placementId: placement.equipmentId,
        }))
        .filter((item) => item.price != null),
    }))
    .filter((group) => group.options.length > 0);
}

export function buildOtherSponsorshipCards(catalogs: CatalogSnapshot) {
  return catalogs.otherSports
    .map((item) => ({
      key: `OTHER-${item.sportId}`,
      type: "OTHER" as const,
      title: item.label,
      description: item.label,
      price: item.price,
      sportId: item.sportId,
    }))
    .filter((item) => item.price != null);
}
