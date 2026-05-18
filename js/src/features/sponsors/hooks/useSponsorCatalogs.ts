import { useCallback, useEffect, useState } from "react";
import i18n from "../../../shared/i18n";
import { fetchCatalogSnapshot } from "../api";
import type { CatalogSnapshot } from "../types";
import { emptySponsorCatalogs, sortSponsorCatalogs } from "../utils";

export function useSponsorCatalogs(options: { enabled?: boolean; errorMessage?: string } = {}) {
  const { enabled = true, errorMessage = i18n.t("sponsors.errors.loadCatalog") } = options;
  const [catalogs, setCatalogs] = useState<CatalogSnapshot>(emptySponsorCatalogs);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const refreshCatalogs = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetchCatalogSnapshot();
      setCatalogs(sortSponsorCatalogs(response));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [errorMessage]);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    void refreshCatalogs();
  }, [enabled, refreshCatalogs]);

  return {
    catalogs,
    errorMessage: error,
    isLoading,
    refreshCatalogs,
    setCatalogs,
    setErrorMessage: setError,
  };
}
