import { BASE_URL } from "../../shared/config/config";
import type {
  CatalogSnapshot,
  EquipmentPlacement,
  OtherSport,
  PubOption,
  PaginatedResponse,
  Sponsor,
  SponsorApprovalItem,
  SponsorFormValues,
  Sponsorship,
  SponsorshipFormValues,
  TeamCategory,
  TeamCategoryPriceOverride,
  TeamGroup,
  TeamGroupPrice,
} from "./types";
import { centsFromEuroInput } from "../../shared/utils";
import { HttpError } from "../../shared/types/HttpError";

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
    throw await HttpError.fromResponse(response);
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

export function fetchSponsors(page = 1, size = 20) {
  const search = new URLSearchParams({
    page: String(page),
    size: String(size),
  });
  return request<PaginatedResponse<Sponsor>>(`/sponsors?${search.toString()}`);
}

export function fetchSponsorById(sponsorId: number) {
  return request<Sponsor>(`/sponsors/${sponsorId}`);
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

export function fetchSponsorshipsBySponsor(sponsorId: number, page = 1, size = 8) {
  const search = new URLSearchParams({
    page: String(page),
    size: String(size),
  });
  return request<PaginatedResponse<Sponsorship>>(`/sponsors/${sponsorId}/sponsorships?${search.toString()}`);
}

export function fetchMySponsorships(page = 1, size = 8) {
  const search = new URLSearchParams({
    page: String(page),
    size: String(size),
  });
  return request<PaginatedResponse<Sponsorship>>(`/sponsorships/my?${search.toString()}`);
}

export function fetchSponsorshipById(sponsorshipId: number) {
  return request<Sponsorship>(`/sponsorships/${sponsorshipId}`);
}

export function fetchAllSponsorships(page = 1, size = 8) {
  const search = new URLSearchParams({
    page: String(page),
    size: String(size),
  });
  return request<PaginatedResponse<SponsorApprovalItem>>(`/sponsorships?${search.toString()}`);
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

export function createPubOption(payload: { code: string; label: string; available: number; free: number; occupied: number; price: number; sortOrder: number }) {
  return request<PubOption>("/sponsorship-catalog/pub-options", {
    method: "POST",
    body: JSON.stringify({
      pubId: 0,
      code: payload.code.trim(),
      label: payload.label.trim(),
      active: true,
      available: payload.available,
      free: payload.free,
      occupied: payload.occupied,
      price: payload.price,
      sortOrder: payload.sortOrder,
    }),
  });
}

export function createSponsorshipWithSponsor(sponsor: SponsorFormValues, values: SponsorshipFormValues, price: number) {
  return request<Sponsorship>("/sponsorships/with-sponsor", {
    method: "POST",
    body: JSON.stringify({
      sponsor: {
        sponsorId: 0,
        name: sponsor.name.trim(),
        email: sponsor.email.trim(),
        phone: sponsor.phone.trim(),
        nif: sponsor.nif.trim(),
      },
      sponsorship: {
        sponsorshipId: 0,
        sponsorId: 0,
        season: values.season.trim(),
        status: "SUBMETIDO",
        type: values.type,
        price,
        pubOptionId: values.pubOptionId ? Number.parseInt(values.pubOptionId, 10) : null,
        teamCategoryId: values.teamCategoryId ? Number.parseInt(values.teamCategoryId, 10) : null,
        placementId: values.placementId ? Number.parseInt(values.placementId, 10) : null,
        sportId: values.sportId ? Number.parseInt(values.sportId, 10) : null,
      },
    }),
  });
}

export function updatePubOption(
  pubId: number,
  payload: { code: string; label: string; active: boolean; available: number; free: number; occupied: number; price: number; sortOrder: number | null },
) {
  return request<PubOption>(`/sponsorship-catalog/pub-options/${pubId}`, {
    method: "PUT",
    body: JSON.stringify({
      pubId,
      code: payload.code.trim(),
      label: payload.label.trim(),
      active: payload.active,
      available: payload.available,
      free: payload.free,
      occupied: payload.occupied,
      price: payload.price,
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

export function fetchTeamCategories() {
  return request<TeamCategory[]>("/teams/categories/active");
}

export function fetchTeamGroups() {
  return request<TeamGroup[]>("/teams/groups/active");
}

export function fetchTeamGroupSponsorshipPrices() {
  return request<TeamGroupPrice[]>("/teams/groups-prices");
}

export function upsertTeamGroupSponsorshipPrice(teamGroupId: number, placementId: number, euroValue: string) {
  return request<TeamGroupPrice>("/teams/groups-prices", {
    method: "PUT",
    body: JSON.stringify({
      teamGroupId,
      placementId,
      price: centsFromEuroInput(euroValue),
    }),
  });
}

export function fetchTeamCategoryPriceOverrides() {
  return request<TeamCategoryPriceOverride[]>("/teams/category-overrides");
}

export function upsertTeamCategoryPriceOverride(teamCategoryId: number, placementId: number, euroValue: string) {
  return request<TeamCategoryPriceOverride>("/teams/category-overrides", {
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

export function createOtherSport(payload: { code: string; label: string; price: number; sortOrder: number }) {
  return request<OtherSport>("/sponsorship-catalog/other-sports", {
    method: "POST",
    body: JSON.stringify({
      sportId: 0,
      code: payload.code.trim(),
      label: payload.label.trim(),
      active: true,
      price: payload.price,
      sortOrder: payload.sortOrder,
    }),
  });
}

export function updateOtherSport(
  sportId: number,
  payload: { code: string; label: string; active: boolean; price: number; sortOrder: number | null },
) {
  return request<OtherSport>(`/sponsorship-catalog/other-sports/${sportId}`, {
    method: "PUT",
    body: JSON.stringify({
      sportId,
      code: payload.code.trim(),
      label: payload.label.trim(),
      active: payload.active,
      price: payload.price,
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

export async function fetchCatalogSnapshot(): Promise<CatalogSnapshot> {
  const [
    pubOptions,
    teamGroups,
    teamCategories,
    equipmentPlacements,
    otherSports,
    teamGroupPrices,
    teamCategoryPriceOverrides,
  ] = await Promise.all([
    fetchPubOptions(),
    fetchTeamGroups(),
    fetchTeamCategories(),
    fetchEquipmentPlacements(),
    fetchOtherSports(),
    fetchTeamGroupSponsorshipPrices(),
    fetchTeamCategoryPriceOverrides(),
  ]);

  return {
    pubOptions,
    teamGroups,
    teamCategories,
    equipmentPlacements,
    otherSports,
    teamGroupPrices,
    teamCategoryPriceOverrides,
  };
}
