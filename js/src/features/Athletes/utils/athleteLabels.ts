import type { TFunction } from "i18next";
import type { AthleteStatus } from "../types";

export function isAdminLike(role?: string): boolean {
  return role === "ADMIN" || role === "SECRETARIA";
}

export function statusLabel(status: AthleteStatus, t: TFunction<"translation", undefined>): string {
  switch (status) {
    case "ATIVO":
      return t("athletes.labels.statuses.ATIVO");
    case "PENDENTE":
      return t("athletes.labels.statuses.PENDENTE");
    case "INATIVO":
      return t("athletes.labels.statuses.INATIVO");
    case "REJEITADO":
      return t("athletes.labels.statuses.REJEITADO");
  }
}

export function statusColor(status: AthleteStatus): string {
  switch (status) {
    case "ATIVO":
      return "athlete-status-active";
    case "PENDENTE":
      return "athlete-status-pending";
    case "INATIVO":
      return "athlete-status-inactive";
    case "REJEITADO":
      return "athlete-status-rejected";
  }
}
