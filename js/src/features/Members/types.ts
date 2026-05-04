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
  nif: string;
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
  nif: string;
  category: MemberCategory;
  membershipQuotaEuros: string;
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
