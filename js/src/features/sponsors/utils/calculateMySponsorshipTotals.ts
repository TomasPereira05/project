import type { SponsorshipRow } from "../types";

export function calculateMySponsorshipTotals(items: SponsorshipRow[]) {
  const activeItems = items.filter(({ sponsorship }) => sponsorship.status !== "CANCELADO");

  return {
    count: items.length,
    pending: items.filter(({ sponsorship }) => sponsorship.status === "SUBMETIDO").length,
    value: activeItems.reduce((sum, { sponsorship }) => sum + sponsorship.price, 0),
  };
}
