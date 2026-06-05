import { BASE_URL } from "../../shared/config/config";
import { HttpError } from "../../shared/types/HttpError";
import type { AdminOverviewStats, TrainingSchedule, TrainingScheduleInput } from "./types";

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

export function fetchTrainingSchedules(filters: { season?: string; activeOnly?: boolean } = {}) {
  const search = new URLSearchParams();
  if (filters.season?.trim()) search.set("season", filters.season.trim());
  if (filters.activeOnly !== undefined) search.set("activeOnly", String(filters.activeOnly));
  const query = search.toString();
  return request<TrainingSchedule[]>(`/training-schedules${query ? `?${query}` : ""}`);
}

export function createTrainingSchedule(values: TrainingScheduleInput) {
  return request<TrainingSchedule>("/training-schedules", {
    method: "POST",
    body: JSON.stringify(values),
  });
}

export function updateTrainingSchedule(trainingScheduleId: number, values: TrainingScheduleInput) {
  return request<TrainingSchedule>(`/training-schedules/${trainingScheduleId}`, {
    method: "PUT",
    body: JSON.stringify({ ...values, trainingScheduleId }),
  });
}

export function deactivateTrainingSchedule(trainingScheduleId: number) {
  return request<TrainingSchedule>(`/training-schedules/${trainingScheduleId}`, {
    method: "DELETE",
  });
}

export function reactivateTrainingSchedule(trainingScheduleId: number) {
  return request<TrainingSchedule>(`/training-schedules/${trainingScheduleId}/reactivate`, {
    method: "PUT",
  });
}
