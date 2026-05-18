import { useEffect, useState } from "react";
import i18n from "../../../shared/i18n";
import { fetchCatalogSnapshot, fetchMySponsorships, fetchSponsorById } from "../api";
import type { CatalogSnapshot, SponsorshipRow } from "../types";
import { emptySponsorCatalogs, sortSponsorCatalogs } from "../utils";

const PAGE_SIZE = 8;

export function useMySponsorships(page: number) {
  const [items, setItems] = useState<SponsorshipRow[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [catalogs, setCatalogs] = useState<CatalogSnapshot>(emptySponsorCatalogs);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadSponsorships() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const [sponsorships, catalogSnapshot] = await Promise.all([
          fetchMySponsorships(page, PAGE_SIZE),
          fetchCatalogSnapshot(),
        ]);
        const sponsorIds = Array.from(new Set(sponsorships.items.map((item) => item.sponsorId)));
        const sponsors = await Promise.all(sponsorIds.map((sponsorId) => fetchSponsorById(sponsorId)));
        const sponsorsById = new Map(sponsors.map((sponsor) => [sponsor.sponsorId, sponsor]));

        if (!ignore) {
          setCatalogs(sortSponsorCatalogs(catalogSnapshot));
          setTotalItems(sponsorships.total);
          setTotalPages(sponsorships.totalPages);
          setItems(
            sponsorships.items.map((sponsorship) => ({
              sponsorship,
              sponsor: sponsorsById.get(sponsorship.sponsorId) ?? null,
            })),
          );
        }
      } catch (error) {
        if (!ignore) {
          setErrorMessage(error instanceof Error ? error.message : i18n.t("sponsors.errors.loadSponsorships"));
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    void loadSponsorships();

    return () => {
      ignore = true;
    };
  }, [page]);

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
