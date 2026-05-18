import { useEffect, useState } from "react";
import i18n from "../../../shared/i18n";
import { fetchCatalogSnapshot, fetchSponsorById, fetchSponsorshipById } from "../api";
import type { CatalogSnapshot, Sponsor, Sponsorship } from "../types";
import { emptySponsorCatalogs, sortSponsorCatalogs } from "../utils";

export function useSponsorshipDetails(sponsorshipId?: string) {
  const [sponsorship, setSponsorship] = useState<Sponsorship | null>(null);
  const [sponsor, setSponsor] = useState<Sponsor | null>(null);
  const [catalogs, setCatalogs] = useState<CatalogSnapshot>(emptySponsorCatalogs);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let ignore = false;
    const parsedId = Number.parseInt(sponsorshipId ?? "", 10);

    async function loadSponsorship() {
      if (!Number.isFinite(parsedId)) {
        setErrorMessage(i18n.t("sponsors.details.invalid"));
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage("");

      try {
        const [sponsorshipResult, catalogSnapshot] = await Promise.all([
          fetchSponsorshipById(parsedId),
          fetchCatalogSnapshot(),
        ]);
        const sponsorResult = await fetchSponsorById(sponsorshipResult.sponsorId);

        if (!ignore) {
          setSponsorship(sponsorshipResult);
          setSponsor(sponsorResult);
          setCatalogs(sortSponsorCatalogs(catalogSnapshot));
        }
      } catch (error) {
        if (!ignore) {
          setErrorMessage(error instanceof Error ? error.message : i18n.t("sponsors.details.loadError"));
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    void loadSponsorship();

    return () => {
      ignore = true;
    };
  }, [sponsorshipId]);

  return {
    catalogs,
    errorMessage,
    isLoading,
    sponsor,
    sponsorship,
  };
}
