import type { Member, MemberFormValues, ViewerMode, PaymentHistoryItem } from "./types";

export function eurosFromCents(valueInCents: number) {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
  }).format(valueInCents / 100);
}

export function formatDate(value: string | null) {
  if (!value) return "Por definir";

  return new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function defaultMemberFormValues(member?: Member): MemberFormValues {
  return {
    completeName: member?.completeName ?? "",
    birthDate: member?.birthDate ?? "",
    email: member?.email ?? "",
    phone: member?.phone ?? "",
    homePhone: member?.homePhone ?? "",
    address: member?.address ?? "",
    postalCode: member?.postalCode ?? "",
    city: member?.city ?? "",
    category: member?.category ?? "SOCIO",
    formerMember: member?.formerMember ?? false,
    billingLocation: member?.billingLocation ?? "",
    privacyAccepted: member?.privacyAccepted ?? false,
    comsAccepted: member?.comsAccepted ?? false,
  };
}

export function getViewerMode(search: string): ViewerMode {
  const params = new URLSearchParams(search);
  const viewer = params.get("viewer");

  if (viewer === "admin" || viewer === "self" || viewer === "public") {
    return viewer;
  }

  return "admin";
}

export function buildPaymentHistory(member: Member): PaymentHistoryItem[] {
  if (member.category === "ATLETA_SOCIO" || member.membershipQuota === 0) {
    return [];
  }

  const baseAmount = member.membershipQuota;
  const monthLabels = [
    "Janeiro",
    "Fevereiro",
    "Marco",
    "Abril",
    "Maio",
    "Junho",
  ];

  return monthLabels.map((month, index) => {
    const isPaid = index < 3;
    const monthNumber = String(index + 1).padStart(2, "0");

    return {
      id: `${member.memberId}-${monthNumber}`,
      label: `Quota de ${month}`,
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
