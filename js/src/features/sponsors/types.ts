export type SponsorRole = "ADMIN" | "SECRETARIA" | "NORMAL";

export type Sponsor = {
  sponsorId: number;
  name: string;
  email: string;
  phone: string;
  nif: string;
};

export type SponsorType = "PUB" | "TEAM" | "OTHER";
export type SponsorshipStatus = "SUBMETIDO" | "APROVADO" | "PAGO" | "ATIVO" |"CANCELADO";

export type Sponsorship = {
  sponsorshipId: number;
  sponsorId: number;
  season: string;
  status: SponsorshipStatus;
  type: SponsorType;
  price: number;
  pubOptionId: number | null;
  teamCategoryId: number | null;
  placementId: number | null;
  sportId: number | null;
};

export type PubOption = {
  pubId: number;
  code: string;
  label: string;
  active: boolean;
  sortOrder: number | null;
};

export type TeamCategory = {
  teamId: number;
  teamGroupId: number;
  code: string;
  label: string;
  active: boolean;
  sortOrder: number | null;
};

export type TeamGroup = {
  teamGroupId: number;
  code: string;
  label: string;
  active: boolean;
  sortOrder: number | null;
};

export type EquipmentPlacement = {
  equipmentId: number;
  code: string;
  label: string;
  active: boolean;
  sortOrder: number | null;
};

export type OtherSport = {
  sportId: number;
  code: string;
  label: string;
  active: boolean;
  sortOrder: number | null;
};

export type PubOptionPrice = {
  pubOptionId: number;
  price: number;
};

export type TeamGroupPrice = {
  teamGroupId: number;
  placementId: number;
  price: number;
};

export type TeamCategoryPriceOverride = {
  teamCategoryId: number;
  placementId: number;
  price: number;
};

export type OtherSportPrice = {
  sportId: number;
  price: number;
};

export type CatalogSnapshot = {
  pubOptions: PubOption[];
  teamGroups: TeamGroup[];
  teamCategories: TeamCategory[];
  equipmentPlacements: EquipmentPlacement[];
  otherSports: OtherSport[];
  pubOptionPrices: PubOptionPrice[];
  teamGroupPrices: TeamGroupPrice[];
  teamCategoryPriceOverrides: TeamCategoryPriceOverride[];
  otherSportPrices: OtherSportPrice[];
};

export type SponsorFormValues = {
  name: string;
  email: string;
  phone: string;
  nif: string;
};

export type SponsorshipFormValues = {
  sponsorId: string;
  season: string;
  type: SponsorType;
  pubOptionId: string;
  teamCategoryId: string;
  placementId: string;
  sportId: string;
};
