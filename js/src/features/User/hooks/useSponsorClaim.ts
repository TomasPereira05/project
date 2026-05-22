import { useState, type FormEvent } from "react";
import type { TFunction } from "i18next";
import { claimSponsorAccount } from "../../sponsors";

export function useSponsorClaim(t: TFunction<"translation", undefined>) {
  const [claimForm, setClaimForm] = useState({ nif: "", email: "", phone: "" });
  const [claimMessage, setClaimMessage] = useState("");
  const [claimError, setClaimError] = useState("");
  const [claimed, setClaimed] = useState(false);

  async function handleSponsorClaim(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setClaimMessage("");
    setClaimError("");

    try {
      const sponsor = await claimSponsorAccount(claimForm);
      setClaimMessage(t("userPage.sponsorClaim.success", { sponsorName: sponsor.name }));
      setClaimForm({ nif: "", email: "", phone: "" });
      setClaimed(true);
    } catch (error) {
      setClaimError(error instanceof Error ? error.message : t("userPage.sponsorClaim.error"));
    }
  }

  return {
    claimError,
    claimForm,
    claimMessage,
    claimed,
    handleSponsorClaim,
    setClaimForm,
  };
}
