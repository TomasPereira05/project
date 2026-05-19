import { useEffect, useMemo, useState } from "react";
import type { TFunction } from "i18next";
import { approveMember, fetchMember, rejectMember } from "../api";
import type { Member } from "../types";
import { buildPaymentHistory, getDebtSummary } from "../utils";

export function useMemberDetail(
  memberId: string | undefined,
  canLoad: boolean,
  t: TFunction<"translation", undefined>,
) {
  const [member, setMember] = useState<Member | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadMember() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const response = await fetchMember(Number(memberId));
        if (!ignore) {
          setMember(response);
        }
      } catch {
        if (!ignore) {
          setErrorMessage(t("members.detail.errors.load"));
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    if (memberId && canLoad) {
      loadMember();
    }

    return () => {
      ignore = true;
    };
  }, [memberId, canLoad, t]);

  const paymentHistory = useMemo(() => (member ? buildPaymentHistory(member, t) : []), [member, t]);
  const debtSummary = useMemo(() => getDebtSummary(paymentHistory), [paymentHistory]);

  async function handleApprove() {
    if (!member) return;

    try {
      const updated = await approveMember(member.memberId);
      setMember(updated);
      setFeedback(t("members.detail.feedback.approved"));
      setErrorMessage("");
    } catch {
      setErrorMessage(t("members.detail.errors.approve"));
    }
  }

  async function handleReject() {
    if (!member) return;

    try {
      const updated = await rejectMember(member.memberId);
      setMember(updated);
      setFeedback(t("members.detail.feedback.rejected"));
      setErrorMessage("");
    } catch {
      setErrorMessage(t("members.detail.errors.reject"));
    }
  }

  return {
    debtSummary,
    errorMessage,
    feedback,
    handleApprove,
    handleReject,
    isLoading,
    member,
    paymentHistory,
  };
}
