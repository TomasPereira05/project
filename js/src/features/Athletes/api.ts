import { BASE_URL } from "../../shared/config/config";
import { HttpError } from "../../shared/types/HttpError";
import type {
  Athlete,
  AthleteAdmin,
  AthleteDetail,
  AthleteInput,
  AthleteUpdateRequest,
  PaginatedResponse,
  TeamCatalogCategory,
  TeamGroup,
} from "./types";

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

// ─────────────────────────────────────────────────────────────────
// PÚBLICOS (anónimo OK)
// ─────────────────────────────────────────────────────────────────

/** Lista atletas activos de uma categoria. GET /api/teams/{id}/athletes */
export function listByCategory(teamCategoryId: number) {
  return request<Athlete[]>(`/teams/${teamCategoryId}/athletes`);
}

/** Detalhe público do atleta (sem data de nascimento exacta). GET /api/athletes/{id} */
export function getAthleteDetail(athleteId: number) {
  return request<AthleteDetail>(`/athletes/${athleteId}`);
}

// ─────────────────────────────────────────────────────────────────
// AUTENTICADO (qualquer role)
// ─────────────────────────────────────────────────────────────────

/**
 * Devolve o atleta do próprio user autenticado, com dados sensíveis (o user tem
 * direito a ver os SEUS dados). 404 se o user não tem atleta associado.
 * GET /api/athletes/me
 */
export function getMyAthlete() {
  return request<AthleteAdmin>("/athletes/me");
}

/** Inscreve um atleta novo (cria Member + Athlete + Guardians). POST /api/athletes */
export function createAthlete(input: AthleteInput) {
  return request<AthleteAdmin>("/athletes", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

// ─────────────────────────────────────────────────────────────────
// SECRETARIA / ADMIN
// ─────────────────────────────────────────────────────────────────

/**
 * Lista admin paginada (com dados sensíveis). GET /api/athletes?page&size
 * Pendentes vêm sempre na página 1 (ordenação no backend).
 */
export function listAllAdmin(page = 1, size = 8) {
  const search = new URLSearchParams({ page: String(page), size: String(size) });
  return request<PaginatedResponse<AthleteAdmin>>(`/athletes?${search.toString()}`);
}

/** Detalhe admin (incluindo guardians completos). GET /api/athletes/{id}/admin */
export function getAdminDetail(athleteId: number) {
  return request<AthleteAdmin>(`/athletes/${athleteId}/admin`);
}

/** Detalhe admin por memberId. GET /api/athletes/member/{memberId} */
export function getByMemberIdAdmin(memberId: number) {
  return request<AthleteAdmin>(`/athletes/member/${memberId}`);
}

/** Update administrativo dos campos editáveis. PUT /api/athletes/{id} */
export function updateAthlete(athleteId: number, payload: AthleteUpdateRequest) {
  return request<AthleteAdmin>(`/athletes/${athleteId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

/** Muda a categoria do atleta. PUT /api/athletes/{id}/team-category */
export function changeTeamCategory(athleteId: number, teamCategoryId: number) {
  return request<AthleteAdmin>(`/athletes/${athleteId}/team-category`, {
    method: "PUT",
    body: JSON.stringify({ teamCategoryId }),
  });
}

/** PUT /api/athletes/{id}/school-info */
export function updateSchoolInfo(
  athleteId: number,
  school: string,
  schoolYear: string,
  schoolClass: string,
) {
  return request<AthleteAdmin>(`/athletes/${athleteId}/school-info`, {
    method: "PUT",
    body: JSON.stringify({ school, schoolYear, schoolClass }),
  });
}

/** Marca atleta como inactivo. PATCH /api/athletes/{id}/deactivate */
export function deactivateAthlete(athleteId: number) {
  return request<AthleteAdmin>(`/athletes/${athleteId}/deactivate`, {
    method: "PATCH",
  });
}

/** Reactiva um atleta inactivo. PUT /api/athletes/{id}/reactivate */
export function reactivateAthlete(athleteId: number) {
  return request<AthleteAdmin>(`/athletes/${athleteId}/reactivate`, {
    method: "PUT",
  });
}

/** Aprova inscrição pendente: Member PENDENTE→ATIVO + Athlete.active=true. */
export function approveAthlete(athleteId: number, approvalDate: string) {
  return request<AthleteAdmin>(`/athletes/${athleteId}/approve`, {
    method: "PUT",
    body: JSON.stringify({ approvalDate }),
  });
}

/** Rejeita inscrição pendente: Member PENDENTE→REJEITADO + Athlete.active=false. */
export function rejectAthlete(athleteId: number) {
  return request<AthleteAdmin>(`/athletes/${athleteId}/reject`, {
    method: "PUT",
  });
}

// ─────────────────────────────────────────────────────────────────
// TEAM CATEGORY MANAGEMENT (Settings) — fora do scope do refactor de atletas
// ─────────────────────────────────────────────────────────────────

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
