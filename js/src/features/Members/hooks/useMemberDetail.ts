import { useEffect, useMemo, useState } from "react";
import type { TFunction } from "i18next";
import { approveMember, createMembershipFeesCheckoutSession, fetchMember, fetchMembershipFeeOptions, rejectMember } from "../api";
import type { Member, MembershipFeeOption } from "../types";
import { buildPaymentHistoryFromFeeOptions, getDebtSummary } from "../utils";

export function useMemberDetail(
  memberId: string | undefined,
  canLoad: boolean,
  t: TFunction<"translation", undefined>,
) {
  const [member, setMember] = useState<Member | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [feeOptions, setFeeOptions] = useState<MembershipFeeOption[]>([]);
  const [selectedFees, setSelectedFees] = useState<Set<string>>(new Set());
  const [isPaying, setIsPaying] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function loadMember() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const response = await fetchMember(Number(memberId));
        const fees = await fetchMembershipFeeOptions(Number(memberId));
        if (!ignore) {
          setMember(response);
          setFeeOptions(fees);
          setSelectedFees(new Set(fees.filter((fee) => fee.selectable && fee.status !== "PAID").map(feeKey)));
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

  const paymentHistory = useMemo(() => buildPaymentHistoryFromFeeOptions(feeOptions, t), [feeOptions, t]);
  const debtSummary = useMemo(() => getDebtSummary(paymentHistory), [paymentHistory]);
  const selectedFeeOptions = useMemo(
    () => feeOptions.filter((fee) => selectedFees.has(feeKey(fee)) && fee.selectable),
    [feeOptions, selectedFees],
  );
  const selectedTotalCents = useMemo(
    () => selectedFeeOptions.reduce((sum, fee) => sum + fee.amount, 0),
    [selectedFeeOptions],
  );

  function toggleFee(option: MembershipFeeOption) {
    if (!option.selectable) return;
    setSelectedFees((current) => {
      const next = new Set(current);
      const key = feeKey(option);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  async function handlePaySelectedFees() {
    if (!member || selectedFeeOptions.length === 0) return;

    try {
      setIsPaying(true);
      setErrorMessage("");
      const session = await createMembershipFeesCheckoutSession(
        member.memberId,
        selectedFeeOptions.map(({ season, month }) => ({ season, month })),
      );
      window.location.assign(session.checkoutUrl);
    } catch {
      setErrorMessage(t("members.detail.finance.paymentError"));
      setIsPaying(false);
    }
  }

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
    handlePaySelectedFees,
    handleReject,
    isPaying,
    isLoading,
    feeOptions,
    member,
    paymentHistory,
    selectedFees,
    selectedFeeOptions,
    selectedTotalCents,
    toggleFee,
  };
}

function feeKey(option: Pick<MembershipFeeOption, "season" | "month">) {
  return `${option.season}-${option.month}`;
}
