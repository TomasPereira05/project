/**
 * Tipos da grelha de quotas/mensalidades, partilhados entre as features que pagam por mês
 * (Sócios e Atletas). A lógica que opera sobre eles vive em `shared/hooks/useFeePayments` e
 * `shared/utils/feeOptions`; cada feature traz só o seu wrapper de fetch/checkout.
 */

export type FeeStatus = "PAID" | "PENDING" | "CANCELLED";

/** Uma opção de pagamento mensal (um mês de uma época), com o seu estado de cobrança. */
export type FeeOption = {
  season: string;
  month: number;
  amount: number;
  dueDate: string;
  status: FeeStatus | null;
  selectable: boolean;
  receiptPaymentId: number | null;
};

/** Identificação mínima de um mês a pagar, enviada ao checkout. */
export type FeeSelection = {
  season: string;
  month: number;
};

/** Resumo de dívida para os cartões de KPI (meses vencidos e por pagar). */
export type FeeDebtSummary = {
  pendingCount: number;
  pendingCents: number;
};

/** Linha do histórico de pagamentos (tabela "Histórico"). */
export type FeePaymentHistoryItem = {
  id: string;
  label: string;
  season: string;
  amountCents: number;
  status: FeeStatus;
  dueDate: string;
  receiptPaymentId: number | null;
};
