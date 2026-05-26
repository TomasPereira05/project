import { useCallback, useEffect, useState } from "react";
import i18n from "../../../shared/i18n";
import { fetchAllSponsorships, fetchCatalogSnapshot } from "../api";
import type { CatalogSnapshot, SponsorApprovalItem } from "../types";
import { emptySponsorCatalogs, sortSponsorCatalogs } from "../utils";

const PAGE_SIZE = 8;

export function useAdminSponsorships(page: number) {
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
        fetchAllSponsorships(page, PAGE_SIZE),
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
  }, [page]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  return {
    catalogs,
    errorMessage,
    isLoading,
    items,
    pageSize: PAGE_SIZE,
    totalItems,
    totalPages,
  };
}
