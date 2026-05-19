import type { Member, PaymentHistoryItem } from "../types";

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
  const pending = history.filter((item) => item.status === "PENDING");
  const pendingCents = pending.reduce((sum, item) => sum + item.amountCents, 0);

  return {
    pendingCount: pending.length,
    pendingCents,
  };
}
