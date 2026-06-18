import { monthName } from "../../../shared/utils";
import type { FeeOption, FeePaymentHistoryItem } from "../../../shared/types/fees";

type Translate = (key: string, options?: Record<string, unknown>) => string;

/** Linhas do histórico de pagamentos do atleta, derivadas das opções de mensalidade. */
export function buildAthletePaymentHistory(options: FeeOption[], t?: Translate): FeePaymentHistoryItem[] {
  return options.map((option) => ({
    id: `${option.season}-${option.month}`,
    label: monthName(option.month, t),
    season: option.season,
    amountCents: option.amount,
    status: option.status ?? "PENDING",
    dueDate: option.dueDate,
    receiptPaymentId: option.receiptPaymentId,
  }));
}
