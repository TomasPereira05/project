import { todayISO } from "./dateInputs";
import type { FeeDebtSummary, FeeOption } from "../types/fees";

type Translate = (key: string, options?: Record<string, unknown>) => string;

/** Chave estável de uma opção (época+mês) para Sets de seleção e dedup. */
export function feeKey(option: { season: string; month: number }): string {
  return `${option.season}-${option.month}`;
}

/** Em atraso = ainda por pagar (selecionável) e com vencimento já passado. */
export function isFeeOverdue(option: Pick<FeeOption, "dueDate" | "selectable">): boolean {
  return option.selectable && option.dueDate <= todayISO();
}

/**
 * Seleção pré-marcada por omissão ao abrir a secção: os meses em atraso. Se algum desses já
 * tem cobrança PENDING (sessão de pagamento começada), restringe a esses para não misturar
 * meses de cobranças diferentes no mesmo checkout.
 */
export function getDefaultSelectedFees(options: FeeOption[]): FeeOption[] {
  const overdue = options.filter(isFeeOverdue);
  const pendingOverdue = overdue.filter((option) => option.status === "PENDING");
  return pendingOverdue.length > 0 ? pendingOverdue : overdue;
}

/** Cartões de KPI: meses vencidos (vencimento passado) e ainda não pagos, e o total devido. */
export function getFeeDebtSummary(options: FeeOption[]): FeeDebtSummary {
  const today = todayISO();
  const pending = options.filter(
    (option) => (option.status === null || option.status === "PENDING") && option.dueDate <= today,
  );
  return {
    pendingCount: pending.length,
    pendingCents: pending.reduce((sum, option) => sum + option.amount, 0),
  };
}

/** Nome do mês (1-12) via i18n partilhado; fallback para o número com dois dígitos. */
export function monthName(month: number, t?: Translate): string {
  const keys = [
    "january",
    "february",
    "march",
    "april",
    "may",
    "june",
    "july",
    "august",
    "september",
    "october",
    "november",
    "december",
  ];
  const key = keys[month - 1];
  if (key && t) return t(`shared.months.${key}`);

  return String(month).padStart(2, "0");
}
