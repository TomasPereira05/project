import { BASE_URL } from "../../shared/config/config";
import { HttpError } from "../../shared/types/HttpError";

export type AdminOverviewStats = {
  totalMembers: number;
  activeMembers: number;
  pendingMembers: number;
  totalAthletes: number;
  activeAthletes: number;
  pendingAthletes: number;
  totalSponsorships: number;
  pendingSponsorships: number;
};

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

  return response.json() as Promise<T>;
}

export function fetchAdminOverviewStats() {
  return request<AdminOverviewStats>("/admin/overview/stats");
}
