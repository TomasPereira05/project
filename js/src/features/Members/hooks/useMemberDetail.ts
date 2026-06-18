import { useEffect, useMemo, useState } from "react";
import type { TFunction } from "i18next";
import { approveMember, createMembershipFeesCheckoutSession, fetchMember, fetchMembershipFeeOptions, markMembershipFeesPaid, rejectMember } from "../api";
import type { Member, MembershipFeeOption } from "../types";
import { buildPaymentHistoryFromFeeOptions } from "../utils";
import { useFeePayments } from "../../../shared/hooks/useFeePayments";
import type { FeeSelection } from "../../../shared/types/fees";

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

  // Motor partilhado: KPIs, seleção, atalhos, paginação, total e checkout. O carregamento e as
  // ações próprias de sócio (aprovar/rejeitar/marcar pago) ficam aqui, compostos por cima.
  const feePayments = useFeePayments({
    feeOptions,
    createCheckout: (selections: FeeSelection[]) => createMembershipFeesCheckoutSession(Number(memberId), selections),
    setErrorMessage,
    payErrorMessage: t("members.detail.finance.paymentError"),
  });
  const { initSelection, clearSelection, setIsPaying } = feePayments;

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
          initSelection(fees);
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
  }, [memberId, canLoad, t, initSelection]);

  const paymentHistory = useMemo(() => buildPaymentHistoryFromFeeOptions(feeOptions, t), [feeOptions, t]);

  async function handleMarkSelectedFeesPaid() {
    if (!member || feePayments.selectedFeeOptions.length === 0) return;

    try {
      setIsPaying(true);
      setErrorMessage("");
      const fees = await markMembershipFeesPaid(
        member.memberId,
        feePayments.selectedFeeOptions.map(({ season, month }) => ({ season, month })),
      );
      setFeeOptions(fees);
      clearSelection();
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
    availableSeasons: feePayments.availableSeasons,
    debtSummary: feePayments.debtSummary,
    errorMessage,
    feePage: feePayments.feePage,
    feeTotalPages: feePayments.feeTotalPages,
    feedback,
    goToNextFeePage: feePayments.goToNextFeePage,
    goToPreviousFeePage: feePayments.goToPreviousFeePage,
    handleApprove,
    handleMarkSelectedFeesPaid,
    handlePaySelectedFees: feePayments.handlePaySelectedFees,
    handleReject,
    isPaying: feePayments.isPaying,
    isLoading,
    feeOptions,
    member,
    paymentHistory,
    selectedFees: feePayments.selectedFees,
    selectedFeeOptions: feePayments.selectedFeeOptions,
    selectedTotalCents: feePayments.selectedTotalCents,
    selectOverdueFees: feePayments.selectOverdueFees,
    selectSeasonFees: feePayments.selectSeasonFees,
    toggleFee: feePayments.toggleFee,
    visibleFeeOptions: feePayments.visibleFeeOptions,
  };
}
