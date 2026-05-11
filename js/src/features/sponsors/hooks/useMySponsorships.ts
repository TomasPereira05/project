import { useEffect, useState } from "react";
import { fetchCatalogSnapshot, fetchMySponsorships, fetchSponsorById } from "../api";
import type { CatalogSnapshot, SponsorshipRow } from "../types";
import { emptySponsorCatalogs, sortSponsorCatalogs } from "../utils";

export function useMySponsorships() {
  const [items, setItems] = useState<SponsorshipRow[]>([]);
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
          fetchMySponsorships(),
          fetchCatalogSnapshot(),
        ]);
        const sponsorIds = Array.from(new Set(sponsorships.map((item) => item.sponsorId)));
        const sponsors = await Promise.all(sponsorIds.map((sponsorId) => fetchSponsorById(sponsorId)));
        const sponsorsById = new Map(sponsors.map((sponsor) => [sponsor.sponsorId, sponsor]));

        if (!ignore) {
          setCatalogs(sortSponsorCatalogs(catalogSnapshot));
          setItems(
            sponsorships.map((sponsorship) => ({
              sponsorship,
              sponsor: sponsorsById.get(sponsorship.sponsorId) ?? null,
            })),
          );
        }
      } catch (error) {
        if (!ignore) {
          setErrorMessage(error instanceof Error ? error.message : "Nao foi possivel carregar os patrocinios.");
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
  }, []);

  return {
    catalogs,
    errorMessage,
    isLoading,
    items,
  };
}
