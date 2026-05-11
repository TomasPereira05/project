import { useCallback, useEffect, useState } from "react";
import { approveSponsorship, cancelSponsorship, fetchAllSponsorships, markSponsorshipPaid } from "../api";
import type { SponsorApprovalItem } from "../utils";

type SponsorApprovalAction = "approve" | "paid" | "cancel";

export function useSponsorApprovals(canManage: boolean) {
  const [items, setItems] = useState<SponsorApprovalItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const loadItems = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await fetchAllSponsorships();
      setItems(response);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Nao foi possivel carregar os patrocinios.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!canManage) {
      setIsLoading(false);
      return;
    }

    void loadItems();
  }, [canManage, loadItems]);

  async function runAction(sponsorshipId: number, action: SponsorApprovalAction) {
    try {
      if (action === "approve") {
        await approveSponsorship(sponsorshipId);
      } else if (action === "paid") {
        await markSponsorshipPaid(sponsorshipId);
      } else {
        await cancelSponsorship(sponsorshipId);
      }
      await loadItems();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Nao foi possivel atualizar o patrocinio.");
    }
  }

  return {
    errorMessage,
    isLoading,
    items,
    runAction,
  };
}
