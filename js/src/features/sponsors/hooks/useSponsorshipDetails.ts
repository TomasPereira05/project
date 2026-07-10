import { useEffect, useState } from "react";
import i18n from "../../../shared/i18n";
import { redirectToPaymentCheckout } from "../../../shared/utils/paymentReturnPath";
import { createSponsorshipCheckoutSession, fetchCatalogSnapshot, fetchSponsorById, fetchSponsorshipById, updateSponsorshipDetails } from "../api";
import type { CatalogSnapshot, Sponsor, Sponsorship } from "../types";
import { emptySponsorCatalogs, sortSponsorCatalogs } from "../utils";

export function useSponsorshipDetails(sponsorshipId?: string) {
  const [sponsorship, setSponsorship] = useState<Sponsorship | null>(null);
  const [sponsor, setSponsor] = useState<Sponsor | null>(null);
  const [catalogs, setCatalogs] = useState<CatalogSnapshot>(emptySponsorCatalogs);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaying, setIsPaying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [feedback, setFeedback] = useState("");

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
      setFeedback("");

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

  async function handlePay() {
    if (!sponsorship) {
      return;
    }

    setIsPaying(true);
    setErrorMessage("");

    try {
      const session = await createSponsorshipCheckoutSession(sponsorship.sponsorshipId);
      redirectToPaymentCheckout(session.checkoutUrl);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : i18n.t("sponsors.details.paymentError"));
      setIsPaying(false);
    }
  }

  async function handleSave(values: { email: string; phone: string; nif: string; price?: number | null; otherDetails?: string | null }) {
    if (!sponsorship) {
      return false;
    }

    setIsSaving(true);
    setErrorMessage("");
    setFeedback("");

    try {
      const updated = await updateSponsorshipDetails(sponsorship.sponsorshipId, values);
      const updatedSponsor = await fetchSponsorById(updated.sponsorId);
      setSponsorship(updated);
      setSponsor(updatedSponsor);
      setFeedback(i18n.t("sponsors.details.updateSuccess"));
      return true;
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : i18n.t("sponsors.details.updateError"));
      return false;
    } finally {
      setIsSaving(false);
    }
  }

  return {
    catalogs,
    errorMessage,
    feedback,
    handlePay,
    handleSave,
    isLoading,
    isPaying,
    isSaving,
    sponsor,
    sponsorship,
  };
}
