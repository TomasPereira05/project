import { useCallback, useEffect, useState } from "react";
import i18n from "../../../shared/i18n";
import { cancelSponsorship, fetchAllSponsorships, fetchCatalogSnapshot, markSponsorshipPaid } from "../api";
import type { CatalogSnapshot, SponsorApprovalItem, SponsorshipStatus } from "../types";
import { emptySponsorCatalogs, sortSponsorCatalogs } from "../utils";

const PAGE_SIZE = 8;

export function useAdminSponsorships(page: number, status?: SponsorshipStatus | "") {
  const [items, setItems] = useState<SponsorApprovalItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [catalogs, setCatalogs] = useState<CatalogSnapshot>(emptySponsorCatalogs);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const loadItems = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const [response, catalogSnapshot] = await Promise.all([
        fetchAllSponsorships(page, PAGE_SIZE, status || undefined),
        fetchCatalogSnapshot(),
      ]);
      setItems(response.items);
      setTotalItems(response.total);
      setTotalPages(response.totalPages);
      setCatalogs(sortSponsorCatalogs(catalogSnapshot));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : i18n.t("sponsors.errors.loadSponsorships"));
    } finally {
      setIsLoading(false);
    }
  }, [page, status]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  async function markPaid(sponsorshipId: number) {
    try {
      await markSponsorshipPaid(sponsorshipId);
      await loadItems();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : i18n.t("sponsors.errors.updateSponsorship"));
    }
  }

  async function cancel(sponsorshipId: number) {
    try {
      await cancelSponsorship(sponsorshipId);
      await loadItems();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : i18n.t("sponsors.errors.updateSponsorship"));
    }
  }

  return {
    catalogs,
    errorMessage,
    isLoading,
    items,
    cancel,
    markPaid,
    pageSize: PAGE_SIZE,
    totalItems,
    totalPages,
  };
}
