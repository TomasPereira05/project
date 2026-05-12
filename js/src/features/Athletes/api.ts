import { BASE_URL } from "../../shared/config/config";
import { HttpError } from "../../shared/types/HttpError";
import type { Athlete, AthleteRegisterValues, TeamCatalogCategory, TeamCategory, TeamGroup } from "./types";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
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

export function fetchActiveAthletes() {
  return request<Athlete[]>("/athletes/active");
}

export function fetchAthleteById(athleteId: number) {
  return request<Athlete>(`/athletes/${athleteId}`);
}

export function fetchAthleteByMemberId(memberId: number) {
  return request<Athlete>(`/athletes/member/${memberId}`);
}

export function changeTeamCategory(athleteId: number, category: TeamCategory) {
  return request<Athlete>(`/athletes/${athleteId}/team-category`, {
    method: "PUT",
    body: JSON.stringify({ category }),
  });
}

export function updateSchoolInfo(
  athleteId: number,
  school: string,
  schoolYear: string,
  schoolClass: string,
) {
  return request<Athlete>(`/athletes/${athleteId}/school-info`, {
    method: "PUT",
    body: JSON.stringify({ school, schoolYear, schoolClass }),
  });
}

export function deactivateAthlete(athleteId: number) {
  return request<Athlete>(`/athletes/${athleteId}`, { method: "DELETE" });
}

export function reactivateAthlete(athleteId: number) {
  return request<Athlete>(`/athletes/${athleteId}/reactivate`, {
    method: "PUT",
  });
}

export function fetchAllTeamCategories() {
  return request<TeamCatalogCategory[]>("/teams/categories");
}

export function createTeamCategory(payload: { teamGroupId: number; code: string; label: string; sortOrder: number }) {
  return request<TeamCatalogCategory>("/teams/categories", {
    method: "POST",
    body: JSON.stringify({
      teamId: 0,
      teamGroupId: payload.teamGroupId,
      code: payload.code.trim(),
      label: payload.label.trim(),
      active: true,
      sortOrder: payload.sortOrder,
    }),
  });
}

export function updateTeamCategory(
  teamId: number,
  payload: { teamGroupId: number; code: string; label: string; active: boolean; sortOrder: number | null },
) {
  return request<TeamCatalogCategory>(`/teams/categories/${teamId}`, {
    method: "PUT",
    body: JSON.stringify({
      teamId,
      teamGroupId: payload.teamGroupId,
      code: payload.code.trim(),
      label: payload.label.trim(),
      active: payload.active,
      sortOrder: payload.sortOrder,
    }),
  });
}

export function deactivateTeamCategory(teamId: number) {
  return request<void>(`/teams/categories/${teamId}`, {
    method: "DELETE",
  });
}

export function reorderTeamCategories(ids: number[]) {
  return request<TeamCatalogCategory[]>("/teams/categories/reorder", {
    method: "PUT",
    body: JSON.stringify({ ids }),
  });
}

export function fetchAllTeamGroups() {
  return request<TeamGroup[]>("/teams/groups");
}

export function createTeamGroup(payload: { code: string; label: string; sortOrder: number }) {
  return request<TeamGroup>("/teams/groups", {
    method: "POST",
    body: JSON.stringify({
      teamGroupId: 0,
      code: payload.code.trim(),
      label: payload.label.trim(),
      active: true,
      sortOrder: payload.sortOrder,
    }),
  });
}

export function updateTeamGroup(
  teamGroupId: number,
  payload: { code: string; label: string; active: boolean; sortOrder: number | null },
) {
  return request<TeamGroup>(`/teams/groups/${teamGroupId}`, {
    method: "PUT",
    body: JSON.stringify({
      teamGroupId,
      code: payload.code.trim(),
      label: payload.label.trim(),
      active: payload.active,
      sortOrder: payload.sortOrder,
    }),
  });
}

export function deactivateTeamGroup(teamGroupId: number) {
  return request<void>(`/teams/groups/${teamGroupId}`, {
    method: "DELETE",
  });
}

export function reorderTeamGroups(ids: number[]) {
  return request<TeamGroup[]>("/teams/groups/reorder", {
    method: "PUT",
    body: JSON.stringify({ ids }),
  });
}

// TODO: substituir por POST /athletes quando o endpoint existir.
// O fluxo final é: secretaria recebe notificação, faz download do dossier
// e reencaminha para a AFL para validar a inscrição.
export async function submitAthleteRegistration(values: AthleteRegisterValues) {
  console.warn("[mock] submitAthleteRegistration", values);
  await new Promise((resolve) => setTimeout(resolve, 400));
  return { ok: true } as const;
}

