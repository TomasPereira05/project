import type {
  EquipmentPlacement,
  OtherSport,
  PubOption,
  SponsorType,
  TeamCategory,
} from "../types";

type Translate = (key: string) => string;

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
  t?: Translate,
) {
  if (sponsorship.type === "PUB") {
    const option = catalogs.pubOptions.find((item) => item.pubId === sponsorship.pubOptionId);
    return option ? option.label : t?.("sponsors.labels.unknown.pub") ?? "Unknown pub option";
  }

  if (sponsorship.type === "TEAM") {
    const team = catalogs.teamCategories.find((item) => item.teamId === sponsorship.teamCategoryId);
    const placement = catalogs.equipmentPlacements.find((item) => item.equipmentId === sponsorship.placementId);
    return [team?.label, placement?.label].filter(Boolean).join(" / ") || t?.("sponsors.labels.unknown.team") || "Unknown team placement";
  }

  const sport = catalogs.otherSports.find((item) => item.sportId === sponsorship.sportId);
  return sport ? sport.label : t?.("sponsors.labels.unknown.sport") ?? "Unknown sport";
}
