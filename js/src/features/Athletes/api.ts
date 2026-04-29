import { BASE_URL } from "../../shared/config/config";
import type { Athlete, AthleteRegisterValues, TeamCategory } from "./types";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Nao foi possivel comunicar com o servidor.");
  }

  return response.json() as Promise<T>;
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

// TODO: substituir por POST /athletes quando o endpoint existir.
// O fluxo final é: secretaria recebe notificação, faz download do dossier
// e reencaminha para a AFL para validar a inscrição.
export async function submitAthleteRegistration(values: AthleteRegisterValues) {
  console.warn("[mock] submitAthleteRegistration", values);
  await new Promise((resolve) => setTimeout(resolve, 400));
  return { ok: true } as const;
}

