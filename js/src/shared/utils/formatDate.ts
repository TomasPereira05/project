export function formatDate(value: string | null) {
  if (!value) return "Por definir";

  return new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}