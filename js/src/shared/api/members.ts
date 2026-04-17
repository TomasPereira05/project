import { BASE_URL } from "../../config";

export type MemberCategory = "SOCIO" | "ATLETA_SOCIO";
export type MemberStatus = "PENDENTE" | "ATIVO" | "INATIVO" | "REJEITADO";
export type ViewerMode = "admin" | "self" | "public";

export type Member = {
  memberId: number;
  memberNumber: number;
  completeName: string;
  birthDate: string;
  email: string;
  phone: string;
  homePhone: string | null;
  address: string;
  postalCode: string;
  city: string;
  category: MemberCategory;
  formerMember: boolean;
  status: MemberStatus;
  membershipQuota: number;
  billingLocation: string | null;
  registrationDate: string;
  approvalDate: string | null;
  privacyAccepted: boolean;
  comsAccepted: boolean;
};

export type MemberFormValues = {
  completeName: string;
  birthDate: string;
  email: string;
  phone: string;
  homePhone: string;
  address: string;
  postalCode: string;
  city: string;
  category: MemberCategory;
  formerMember: boolean;
  billingLocation: string;
  privacyAccepted: boolean;
  comsAccepted: boolean;
};

export type PaymentHistoryItem = {
  id: string;
  label: string;
  season: string;
  amountCents: number;
  status: "PAID" | "PENDING";
  dueDate: string;
  paidDate: string | null;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Nao foi possivel comunicar com o servidor.");
  }

  return response.json() as Promise<T>;
}

export function fetchMembers() {
  return request<Member[]>("/api/members");
}

export function fetchMember(memberId: number) {
  return request<Member>(`/api/members/${memberId}`);
}

export function createMember(values: MemberFormValues) {
  const today = new Date().toISOString().slice(0, 10);
  const membershipQuota = values.category === "ATLETA_SOCIO" ? 0 : 150;

  return request<Member>("/api/members/create", {
    method: "POST",
    body: JSON.stringify({
      memberId: 0,
      memberNumber: 0,
      completeName: values.completeName,
      birthDate: values.birthDate,
      email: values.email,
      phone: values.phone,
      homePhone: values.homePhone || null,
      address: values.address,
      postalCode: values.postalCode,
      city: values.city,
      category: values.category,
      formerMember: values.formerMember,
      status: "PENDENTE",
      membershipQuota,
      billingLocation: values.billingLocation || null,
      registrationDate: today,
      approvalDate: null,
      privacyAccepted: values.privacyAccepted,
      comsAccepted: values.comsAccepted,
    }),
  });
}

export async function updateMember(
  memberId: number,
  initialMember: Member,
  values: MemberFormValues,
) {
  const search = new URLSearchParams({
    email: values.email,
    phone: values.phone,
    address: values.address,
    postalCode: values.postalCode,
    city: values.city,
  });

  if (values.homePhone.trim()) {
    search.set("homePhone", values.homePhone.trim());
  }

  if (values.billingLocation.trim()) {
    search.set("billingLocation", values.billingLocation.trim());
  }

  const updatedMember = await request<Member>(
    `/api/members/${memberId}?${search.toString()}`,
    { method: "PUT" },
  );

  if (initialMember.category !== values.category) {
    return request<Member>(`/api/members/${memberId}/category`, {
      method: "PUT",
      body: JSON.stringify({ category: values.category }),
    });
  }

  return updatedMember;
}

export function approveMember(memberId: number) {
  const approvalDate = new Date().toISOString().slice(0, 10);
  return request<Member>(`/api/members/${memberId}/approve`, {
    method: "PUT",
    body: JSON.stringify({ approvalDate }),
  });
}

export function rejectMember(memberId: number) {
  return request<Member>(`/api/members/${memberId}/reject`, {
    method: "PUT",
  });
}

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
