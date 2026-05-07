import { BASE_URL } from "../../shared/config/config";
import type {
  CatalogSnapshot,
  EquipmentPlacement,
  OtherSport,
  OtherSportPrice,
  PubOption,
  PubOptionPrice,
  Sponsor,
  SponsorFormValues,
  Sponsorship,
  SponsorshipFormValues,
  TeamCategory,
  TeamSponsorshipPrice,
} from "./types";
import { centsFromEuroInput } from "./utils";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    credentials: "include",
    ...init,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Could not communicate with the server.");
  }

  if (response.status === 204) {
    return {} as T;
  }

  const text = await response.text();
  if (!text) {
    return {} as T;
  }

  return JSON.parse(text) as T;
}

export function fetchSponsors() {
  return request<Sponsor[]>("/sponsors");
}

export function createSponsor(values: SponsorFormValues) {
  return request<Sponsor>("/sponsors", {
    method: "POST",
    body: JSON.stringify({
      sponsorId: 0,
      name: values.name.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
      nif: values.nif.trim(),
    }),
  });
}

export function updateSponsor(sponsorId: number, values: SponsorFormValues) {
  return request<Sponsor>(`/sponsors/${sponsorId}`, {
    method: "PUT",
    body: JSON.stringify({
      sponsorId,
      name: values.name.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
      nif: values.nif.trim(),
    }),
  });
}

export function fetchSponsorshipsBySponsor(sponsorId: number) {
  return request<Sponsorship[]>(`/sponsors/${sponsorId}/sponsorships`);
}

export async function fetchAllSponsorships() {
  const sponsors = await fetchSponsors();
  const sponsorships = await Promise.all(
    sponsors.map(async (sponsor) => ({
      sponsor,
      sponsorships: await fetchSponsorshipsBySponsor(sponsor.sponsorId),
    })),
  );

  return sponsorships.flatMap(({ sponsor, sponsorships }) =>
    sponsorships.map((sponsorship) => ({
      sponsor,
      sponsorship,
    })),
  );
}

export function createSponsorship(values: SponsorshipFormValues, price: number) {
  return request<Sponsorship>("/sponsorships", {
    method: "POST",
    body: JSON.stringify({
      sponsorshipId: 0,
      sponsorId: Number.parseInt(values.sponsorId, 10),
      season: values.season.trim(),
      status: "SUBMETIDO",
      type: values.type,
      price,
      pubOptionId: values.pubOptionId ? Number.parseInt(values.pubOptionId, 10) : null,
      teamCategoryId: values.teamCategoryId ? Number.parseInt(values.teamCategoryId, 10) : null,
      placementId: values.placementId ? Number.parseInt(values.placementId, 10) : null,
      sportId: values.sportId ? Number.parseInt(values.sportId, 10) : null,
    }),
  });
}

export function approveSponsorship(sponsorshipId: number) {
  return request<Sponsorship>(`/sponsorships/${sponsorshipId}/approve`, {
    method: "PUT",
  });
}

export function markSponsorshipPaid(sponsorshipId: number) {
  return request<Sponsorship>(`/sponsorships/${sponsorshipId}/paid`, {
    method: "PUT",
  });
}

export function cancelSponsorship(sponsorshipId: number) {
  return request<Sponsorship>(`/sponsorships/${sponsorshipId}/cancel`, {
    method: "PUT",
  });
}

export function fetchPubOptions() {
  return request<PubOption[]>("/sponsorship-catalog/pub-options/active");
}

export function createPubOption(payload: { code: string; label: string; sortOrder: number }) {
  return request<PubOption>("/sponsorship-catalog/pub-options", {
    method: "POST",
    body: JSON.stringify({
      pubId: 0,
      code: payload.code.trim(),
      label: payload.label.trim(),
      active: true,
      sortOrder: payload.sortOrder,
    }),
  });
}

export function updatePubOption(
  pubId: number,
  payload: { code: string; label: string; active: boolean; sortOrder: number | null },
) {
  return request<PubOption>(`/sponsorship-catalog/pub-options/${pubId}`, {
    method: "PUT",
    body: JSON.stringify({
      pubId,
      code: payload.code.trim(),
      label: payload.label.trim(),
      active: payload.active,
      sortOrder: payload.sortOrder,
    }),
  });
}

export function deactivatePubOption(pubId: number) {
  return request<void>(`/sponsorship-catalog/pub-options/${pubId}`, {
    method: "DELETE",
  });
}

export function reorderPubOptions(ids: number[]) {
  return request<PubOption[]>("/sponsorship-catalog/pub-options/reorder", {
    method: "PUT",
    body: JSON.stringify({ ids }),
  });
}

export function fetchPubOptionPrices() {
  return request<PubOptionPrice[]>("/sponsorship-catalog/pub-option-prices");
}

export function upsertPubOptionPrice(pubOptionId: number, euroValue: string) {
  return request<PubOptionPrice>("/sponsorship-catalog/pub-option-prices", {
    method: "PUT",
    body: JSON.stringify({
      pubOptionId,
      price: centsFromEuroInput(euroValue),
    }),
  });
}

export function fetchTeamCategories() {
  return request<TeamCategory[]>("/sponsorship-catalog/team-categories/active");
}

export function createTeamCategory(payload: { code: string; label: string; sortOrder: number }) {
  return request<TeamCategory>("/sponsorship-catalog/team-categories", {
    method: "POST",
    body: JSON.stringify({
      teamId: 0,
      code: payload.code.trim(),
      label: payload.label.trim(),
      active: true,
      sortOrder: payload.sortOrder,
    }),
  });
}

export function updateTeamCategory(
  teamId: number,
  payload: { code: string; label: string; active: boolean; sortOrder: number | null },
) {
  return request<TeamCategory>(`/sponsorship-catalog/team-categories/${teamId}`, {
    method: "PUT",
    body: JSON.stringify({
      teamId,
      code: payload.code.trim(),
      label: payload.label.trim(),
      active: payload.active,
      sortOrder: payload.sortOrder,
    }),
  });
}

export function deactivateTeamCategory(teamId: number) {
  return request<void>(`/sponsorship-catalog/team-categories/${teamId}`, {
    method: "DELETE",
  });
}

export function reorderTeamCategories(ids: number[]) {
  return request<TeamCategory[]>("/sponsorship-catalog/team-categories/reorder", {
    method: "PUT",
    body: JSON.stringify({ ids }),
  });
}

export function fetchTeamSponsorshipPrices() {
  return request<TeamSponsorshipPrice[]>("/sponsorship-catalog/team-prices");
}

export function upsertTeamSponsorshipPrice(teamCategoryId: number, placementId: number, euroValue: string) {
  return request<TeamSponsorshipPrice>("/sponsorship-catalog/team-prices", {
    method: "PUT",
    body: JSON.stringify({
      teamCategoryId,
      placementId,
      price: centsFromEuroInput(euroValue),
    }),
  });
}

export function fetchEquipmentPlacements() {
  return request<EquipmentPlacement[]>("/sponsorship-catalog/equipment-placements/active");
}

export function createEquipmentPlacement(payload: { code: string; label: string; sortOrder: number }) {
  return request<EquipmentPlacement>("/sponsorship-catalog/equipment-placements", {
    method: "POST",
    body: JSON.stringify({
      equipmentId: 0,
      code: payload.code.trim(),
      label: payload.label.trim(),
      active: true,
      sortOrder: payload.sortOrder,
    }),
  });
}

export function updateEquipmentPlacement(
  equipmentId: number,
  payload: { code: string; label: string; active: boolean; sortOrder: number | null },
) {
  return request<EquipmentPlacement>(`/sponsorship-catalog/equipment-placements/${equipmentId}`, {
    method: "PUT",
    body: JSON.stringify({
      equipmentId,
      code: payload.code.trim(),
      label: payload.label.trim(),
      active: payload.active,
      sortOrder: payload.sortOrder,
    }),
  });
}

export function deactivateEquipmentPlacement(equipmentId: number) {
  return request<void>(`/sponsorship-catalog/equipment-placements/${equipmentId}`, {
    method: "DELETE",
  });
}

export function reorderEquipmentPlacements(ids: number[]) {
  return request<EquipmentPlacement[]>("/sponsorship-catalog/equipment-placements/reorder", {
    method: "PUT",
    body: JSON.stringify({ ids }),
  });
}

export function fetchOtherSports() {
  return request<OtherSport[]>("/sponsorship-catalog/other-sports/active");
}

export function createOtherSport(payload: { code: string; label: string; sortOrder: number }) {
  return request<OtherSport>("/sponsorship-catalog/other-sports", {
    method: "POST",
    body: JSON.stringify({
      sportId: 0,
      code: payload.code.trim(),
      label: payload.label.trim(),
      active: true,
      sortOrder: payload.sortOrder,
    }),
  });
}

export function updateOtherSport(
  sportId: number,
  payload: { code: string; label: string; active: boolean; sortOrder: number | null },
) {
  return request<OtherSport>(`/sponsorship-catalog/other-sports/${sportId}`, {
    method: "PUT",
    body: JSON.stringify({
      sportId,
      code: payload.code.trim(),
      label: payload.label.trim(),
      active: payload.active,
      sortOrder: payload.sortOrder,
    }),
  });
}

export function deactivateOtherSport(sportId: number) {
  return request<void>(`/sponsorship-catalog/other-sports/${sportId}`, {
    method: "DELETE",
  });
}

export function reorderOtherSports(ids: number[]) {
  return request<OtherSport[]>("/sponsorship-catalog/other-sports/reorder", {
    method: "PUT",
    body: JSON.stringify({ ids }),
  });
}

export function fetchOtherSportPrices() {
  return request<OtherSportPrice[]>("/sponsorship-catalog/other-sport-prices");
}

export function upsertOtherSportPrice(sportId: number, euroValue: string) {
  return request<OtherSportPrice>("/sponsorship-catalog/other-sport-prices", {
    method: "PUT",
    body: JSON.stringify({
      sportId,
      price: centsFromEuroInput(euroValue),
    }),
  });
}

export async function fetchCatalogSnapshot(): Promise<CatalogSnapshot> {
  const [
    pubOptions,
    teamCategories,
    equipmentPlacements,
    otherSports,
    pubOptionPrices,
    teamSponsorshipPrices,
    otherSportPrices,
  ] = await Promise.all([
    fetchPubOptions(),
    fetchTeamCategories(),
    fetchEquipmentPlacements(),
    fetchOtherSports(),
    fetchPubOptionPrices(),
    fetchTeamSponsorshipPrices(),
    fetchOtherSportPrices(),
  ]);

  return {
    pubOptions,
    teamCategories,
    equipmentPlacements,
    otherSports,
    pubOptionPrices,
    teamSponsorshipPrices,
    otherSportPrices,
  };
}
