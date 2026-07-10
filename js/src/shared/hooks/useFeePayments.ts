import { useCallback, useMemo, useState } from "react";
import type { FeeDebtSummary, FeeOption, FeeSelection } from "../types/fees";
import { feeKey, getDefaultSelectedFees, getFeeDebtSummary } from "../utils/feeOptions";
import { redirectToPaymentCheckout } from "../utils/paymentReturnPath";

const FEE_OPTIONS_PAGE_SIZE = 8;

type UseFeePaymentsParams = {
  /** Opções carregadas pela feature (Sócio ou Atleta). O hook é controlado: só deriva estado. */
  feeOptions: FeeOption[];
  /** Wrapper de checkout da feature (mesmo endpoint `/payments/checkout-session`, alvos diferentes). */
  createCheckout: (selections: FeeSelection[]) => Promise<{ checkoutUrl: string }>;
  /** Reporta erros (de pagamento) ao estado de erro da feature, sem o hook conhecer i18n. */
  setErrorMessage: (message: string) => void;
  /** Mensagem mostrada se o arranque do checkout falhar. */
  payErrorMessage: string;
};

/**
 * Motor partilhado da grelha de quotas/mensalidades: KPIs de dívida, seleção múltipla, atalhos
 * (atrasadas / por época), paginação, total selecionado e arranque do checkout. Sem qualquer
 * ramo específico de Sócio/Atleta — a variabilidade entra por injeção (`createCheckout`) e por
 * composição (cada feature acrescenta o seu carregamento e ações próprias por cima).
 */
export function useFeePayments({
  feeOptions,
  createCheckout,
  setErrorMessage,
  payErrorMessage,
}: UseFeePaymentsParams) {
  const [selectedFees, setSelectedFees] = useState<Set<string>>(new Set());
  const [feePage, setFeePage] = useState(1);
  const [isPaying, setIsPaying] = useState(false);

  const debtSummary = useMemo<FeeDebtSummary>(() => getFeeDebtSummary(feeOptions), [feeOptions]);

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
  const unpaidFeeOptions = useMemo(() => feeOptions.filter((fee) => fee.status !== "PAID"), [feeOptions]);

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

  /** Estado inicial após um carregamento: página 1 e meses em atraso pré-marcados. */
  const initSelection = useCallback((options: FeeOption[]) => {
    setFeePage(1);
    setSelectedFees(new Set(getDefaultSelectedFees(options).map(feeKey)));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedFees(new Set());
  }, []);

  function selectOverdueFees() {
    setSelectedFees(new Set(getDefaultSelectedFees(feeOptions).map(feeKey)));
  }

  function selectSeasonFees(season: string) {
    const seasonFees = feeOptions.filter((fee) => fee.selectable && fee.season === season);
    const pendingSeasonFees = seasonFees.filter((fee) => fee.status === "PENDING");
    setSelectedFees(new Set((pendingSeasonFees.length > 0 ? pendingSeasonFees : seasonFees).map(feeKey)));
  }

  function toggleFee(option: FeeOption) {
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
    if (selectedFeeOptions.length === 0) return;

    try {
      setIsPaying(true);
      setErrorMessage("");
      const session = await createCheckout(selectedFeeOptions.map(({ season, month }) => ({ season, month })));
      redirectToPaymentCheckout(session.checkoutUrl);
    } catch {
      setErrorMessage(payErrorMessage);
      setIsPaying(false);
    }
  }

  return {
    availableSeasons,
    clearSelection,
    debtSummary,
    feePage: safeFeePage,
    feeTotalPages,
    goToNextFeePage,
    goToPreviousFeePage,
    handlePaySelectedFees,
    initSelection,
    isPaying,
    selectedFeeOptions,
    selectedFees,
    selectedTotalCents,
    selectOverdueFees,
    selectSeasonFees,
    setIsPaying,
    setSelectedFees,
    toggleFee,
    visibleFeeOptions,
  };
}
