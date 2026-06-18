import { useEffect, useMemo, useState } from "react";
import type { TFunction } from "i18next";
import { createAthleteFeesCheckoutSession, fetchAthleteFeeOptions } from "../api";
import { buildAthletePaymentHistory } from "../utils/athleteFees";
import { useFeePayments } from "../../../shared/hooks/useFeePayments";
import type { FeeOption, FeeSelection } from "../../../shared/types/fees";

/**
 * Estado da secção de mensalidades de um atleta gerido pela conta. Carrega as opções e delega
 * KPIs/seleção/paginação/checkout ao motor partilhado `useFeePayments`; acrescenta só o que é
 * próprio do atleta (mensalidade base e histórico para a tabela).
 */
export function useAthleteFees(
  memberId: number | undefined,
  t: TFunction<"translation", undefined>,
) {
  const [feeOptions, setFeeOptions] = useState<FeeOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const feePayments = useFeePayments({
    feeOptions,
    createCheckout: (selections: FeeSelection[]) => createAthleteFeesCheckoutSession(Number(memberId), selections),
    setErrorMessage,
    payErrorMessage: t("athletes.fees.payError"),
  });
  const { initSelection } = feePayments;

  useEffect(() => {
    let ignore = false;

    if (!memberId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    fetchAthleteFeeOptions(memberId)
      .then((options) => {
        if (ignore) return;
        setFeeOptions(options);
        initSelection(options);
      })
      .catch(() => {
        if (!ignore) setErrorMessage(t("athletes.fees.loadError"));
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [memberId, t, initSelection]);

  // Mensalidade base = valor de qualquer mês (todos têm a quota do member do atleta).
  const monthlyCents = useMemo(() => feeOptions[0]?.amount ?? 0, [feeOptions]);
  const paymentHistory = useMemo(() => buildAthletePaymentHistory(feeOptions, t), [feeOptions, t]);

  return {
    ...feePayments,
    feeOptions,
    isLoading,
    errorMessage,
    monthlyCents,
    paymentHistory,
  };
}
