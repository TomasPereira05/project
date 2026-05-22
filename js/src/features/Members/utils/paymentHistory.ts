import type { Member, MembershipFeeOption, PaymentHistoryItem } from "../types";
import { todayISO } from "../../../shared/utils/dateInputs";

type Translate = (key: string, options?: Record<string, unknown>) => string;

export function buildPaymentHistory(member: Member, t?: Translate): PaymentHistoryItem[] {
  if (member.category === "ATLETA_SOCIO" || member.membershipQuota === 0) {
    return [];
  }

  const baseAmount = member.membershipQuota;
  const monthLabels = t
    ? [
        t("members.months.january"),
        t("members.months.february"),
        t("members.months.march"),
        t("members.months.april"),
        t("members.months.may"),
        t("members.months.june"),
        t("members.months.july"),
        t("members.months.august"),
        t("members.months.september"),
        t("members.months.october"),
        t("members.months.november"),
        t("members.months.december"),
      ]
    : [
        "Janeiro",
        "Fevereiro",
        "Marco",
        "Abril",
        "Maio",
        "Junho",
        "Julho",
        "Agosto",
        "Setembro",
        "Outubro",
        "Novembro",
        "Dezembro",
      ];

  return monthLabels.map((month, index) => {
    const isPaid = index < 3;
    const monthNumber = String(index + 1).padStart(2, "0");

    return {
      id: `${member.memberId}-${monthNumber}`,
      label: t ? t("members.detail.finance.quotaOf", { month }) : `Quota de ${month}`,
      season: "2025/2026",
      amountCents: baseAmount,
      status: isPaid ? "PAID" : "PENDING",
      dueDate: `2026-${monthNumber}-08`,
      paidDate: isPaid ? `2026-${monthNumber}-05` : null,
    };
  });
}

export function getDebtSummary(history: PaymentHistoryItem[]) {
  const today = todayISO();
  const pending = history.filter((item) => item.status === "PENDING" && item.dueDate <= today);
  const pendingCents = pending.reduce((sum, item) => sum + item.amountCents, 0);

  return {
    pendingCount: pending.length,
    pendingCents,
  };
}

export function isFeeOverdue(option: Pick<MembershipFeeOption, "dueDate" | "selectable">) {
  return option.selectable && option.dueDate <= todayISO();
}

export function buildPaymentHistoryFromFeeOptions(
  options: MembershipFeeOption[],
  t?: Translate,
): PaymentHistoryItem[] {
  return options.map((option) => {
    const month = monthName(option.month, t);

    return {
      id: `${option.season}-${option.month}`,
      label: t ? t("members.detail.finance.quotaOf", { month }) : `Quota de ${month}`,
      season: option.season,
      amountCents: option.amount,
      status: option.status ?? "PENDING",
      dueDate: option.dueDate,
      paidDate: option.status === "PAID" ? option.dueDate : null,
    };
  });
}

export function monthName(month: number, t?: Translate) {
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
  if (key && t) return t(`members.months.${key}`);

  return String(month).padStart(2, "0");
}
