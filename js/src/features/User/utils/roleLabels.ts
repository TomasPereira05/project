export function roleLabel(role?: string) {
  switch (role) {
    case "ADMIN":
      return "Administrador";
    case "SECRETARIA":
      return "Secretaria";
    case "NORMAL":
      return "Utilizador";
    default:
      return role ?? "—";
  }
}

export function roleBadgeColor(role?: string) {
  switch (role) {
    case "ADMIN":
      return "bg-purple-50 text-purple-700 border-purple-200";
    case "SECRETARIA":
      return "bg-blue-50 text-blue-700 border-blue-200";
    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
}

/** Roles de backoffice (ADMIN/SECRETARIA) — mostram badge de role e secções extra. */
export function isStaffRole(role?: string): boolean {
  return role === "ADMIN" || role === "SECRETARIA";
}
