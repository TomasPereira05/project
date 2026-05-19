import type { Member } from "../types";

export function memberStatusColor(status: Member["status"]) {
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
