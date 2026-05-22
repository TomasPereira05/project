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
      return "member-status-active";
    case "PENDENTE":
      return "member-status-pending";
    case "INATIVO":
      return "member-status-inactive";
    case "REJEITADO":
      return "member-status-rejected";
  }
}
