import { useEffect, useMemo, useState } from "react";
import type { TFunction } from "i18next";
import { approveMember, createMembershipFeesCheckoutSession, fetchMember, fetchMembershipFeeOptions, markMembershipFeesPaid, rejectMember } from "../api";
import type { Member, MembershipFeeOption } from "../types";
import { buildPaymentHistoryFromFeeOptions, getDebtSummary, isFeeOverdue } from "../utils";

const FEE_OPTIONS_PAGE_SIZE = 8;

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
  const [feePage, setFeePage] = useState(1);
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
          setFeePage(1);
          setSelectedFees(new Set(getDefaultSelectedFees(fees).map(feeKey)));
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
  const availableSeasons = useMemo(
    () => Array.from(new Set(feeOptions.filter((fee) => fee.status !== "PAID").map((fee) => fee.season))),
    [feeOptions],
  );
  const unpaidFeeOptions = useMemo(
    () => feeOptions.filter((fee) => fee.status !== "PAID"),
    [feeOptions],
  );
  const feeTotalPages = Math.max(1, Math.ceil(unpaidFeeOptions.length / FEE_OPTIONS_PAGE_SIZE));
  const safeFeePage = Math.min(feePage, feeTotalPages);
  const visibleFeeOptions = useMemo(
    () => unpaidFeeOptions.slice((safeFeePage - 1) * FEE_OPTIONS_PAGE_SIZE, safeFeePage * FEE_OPTIONS_PAGE_SIZE),
    [safeFeePage, unpaidFeeOptions],
  );

  function goToPreviousFeePage() {
    setFeePage((current) => Math.max(1, current - 1));
  }

  function goToNextFeePage() {
    setFeePage((current) => Math.min(feeTotalPages, current + 1));
  }

  function selectOverdueFees() {
    setSelectedFees(new Set(getDefaultSelectedFees(feeOptions).map(feeKey)));
  }

  function selectSeasonFees(season: string) {
    const seasonFees = feeOptions.filter((fee) => fee.selectable && fee.season === season);
    const pendingSeasonFees = seasonFees.filter((fee) => fee.status === "PENDING");
    setSelectedFees(new Set((pendingSeasonFees.length > 0 ? pendingSeasonFees : seasonFees).map(feeKey)));
  }

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

  async function handleMarkSelectedFeesPaid() {
    if (!member || selectedFeeOptions.length === 0) return;

    try {
      setIsPaying(true);
      setErrorMessage("");
      const fees = await markMembershipFeesPaid(
        member.memberId,
        selectedFeeOptions.map(({ season, month }) => ({ season, month })),
      );
      setFeeOptions(fees);
      setSelectedFees(new Set());
      setFeedback(t("members.detail.finance.markPaidSuccess"));
    } catch {
      setErrorMessage(t("members.detail.finance.markPaidError"));
    } finally {
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
    availableSeasons,
    debtSummary,
    errorMessage,
    feePage: safeFeePage,
    feeTotalPages,
    feedback,
    goToNextFeePage,
    goToPreviousFeePage,
    handleApprove,
    handleMarkSelectedFeesPaid,
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
    selectOverdueFees,
    selectSeasonFees,
    toggleFee,
    visibleFeeOptions,
  };
}

function feeKey(option: Pick<MembershipFeeOption, "season" | "month">) {
  return `${option.season}-${option.month}`;
}

function getDefaultSelectedFees(fees: MembershipFeeOption[]) {
  const overdueFees = fees.filter(isFeeOverdue);
  const pendingOverdueFees = overdueFees.filter((fee) => fee.status === "PENDING");
  return pendingOverdueFees.length > 0 ? pendingOverdueFees : overdueFees;
}
