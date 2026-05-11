import { useCallback, useEffect, useState } from "react";
import { approveSponsorship, cancelSponsorship, fetchAllSponsorships, markSponsorshipPaid } from "../api";
import type { SponsorApprovalItem } from "../utils";

type SponsorApprovalAction = "approve" | "paid" | "cancel";
const PAGE_SIZE = 8;

export function useSponsorApprovals(canManage: boolean, page: number) {
  const [items, setItems] = useState<SponsorApprovalItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const loadItems = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await fetchAllSponsorships(page, PAGE_SIZE);
      setItems(response.items);
      setTotalItems(response.total);
      setTotalPages(response.totalPages);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Nao foi possivel carregar os patrocinios.");
    } finally {
      setIsLoading(false);
    }
  }, [page]);

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
    pageSize: PAGE_SIZE,
    totalItems,
    totalPages,
  };
}
