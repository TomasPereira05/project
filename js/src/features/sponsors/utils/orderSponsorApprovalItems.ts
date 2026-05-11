import type { SponsorApprovalItem } from "../types";

export function orderSponsorApprovalItems(items: SponsorApprovalItem[]) {
  return [...items].sort((first, second) => {
    if (first.sponsorship.status === "SUBMETIDO" && second.sponsorship.status !== "SUBMETIDO") return -1;
    if (first.sponsorship.status !== "SUBMETIDO" && second.sponsorship.status === "SUBMETIDO") return 1;
    return second.sponsorship.sponsorshipId - first.sponsorship.sponsorshipId;
  });
}
