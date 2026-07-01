export type SponsorRole = "ADMIN" | "SECRETARIA" | "NORMAL";

export type PaginatedResponse<T> = {
  items: T[];
  page: number;
  size: number;
  total: number;
  totalPages: number;
};

export type Sponsor = {
  sponsorId: number;
  name: string;
  email: string;
  phone: string;
  nif: string;
  userId: number | null;
  accountUsername?: string | null;
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
  otherDetails: string | null;
};

export type SponsorshipRow = {
  sponsor: Sponsor | null;
  sponsorship: Sponsorship;
};

export type SponsorApprovalItem = {
  sponsor: Sponsor;
  sponsorship: Sponsorship;
};

export type PubOption = {
  pubId: number;
  code: string;
  label: string;
  active: boolean;
  available: number;
  free: number;
  occupied: number;
  price: number;
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
  price: number;
  sortOrder: number | null;
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

export type CatalogSnapshot = {
  pubOptions: PubOption[];
  teamGroups: TeamGroup[];
  teamCategories: TeamCategory[];
  equipmentPlacements: EquipmentPlacement[];
  otherSports: OtherSport[];
  teamGroupPrices: TeamGroupPrice[];
  teamCategoryPriceOverrides: TeamCategoryPriceOverride[];
  occupiedTeamOptions: OccupiedTeamSponsorshipOption[];
};

export type SponsorFormValues = {
  name: string;
  email: string;
  phone: string;
  nif: string;
  userId?: number | null;
};

export type SponsorshipFormValues = {
  sponsorId: string;
  season: string;
  type: SponsorType;
  pubOptionId: string;
  teamCategoryId: string;
  placementId: string;
  sportId: string;
  otherDetails: string;
};

export type OccupiedTeamSponsorshipOption = {
  season: string;
  teamCategoryId: number;
  placementId: number;
};
