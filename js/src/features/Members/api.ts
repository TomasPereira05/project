import { BASE_URL } from "../../shared/config/config";
import type { CheckoutSession, Member, MemberCategory, MemberFormValues, MembershipFeeOption, PaginatedResponse } from "./types";
import { centsFromEuroInput } from "../../shared/utils";
import { HttpError } from "../../shared/types/HttpError";
import { todayISO } from "../../shared/utils/dateInputs";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    throw await HttpError.fromResponse(response);
  }

  return response.json() as Promise<T>;
}

export function fetchMembers(
  page = 1,
  size = 8,
  filters: { search?: string; category?: MemberCategory | "" } = {},
) {
  const search = new URLSearchParams({
    page: String(page),
    size: String(size),
  });
  if (filters.search?.trim()) {
    search.set("search", filters.search.trim());
  }
  if (filters.category) {
    search.set("category", filters.category);
  }
  return request<PaginatedResponse<Member>>(`/members?${search.toString()}`);
}

export function fetchMember(memberId: number) {
  return request<Member>(`/members/${memberId}`);
}

export function createMember(values: MemberFormValues, userId: number | null) {
  const today = todayISO();
  const membershipQuota =
    values.category === "ATLETA_SOCIO"
      ? 0
      : centsFromEuroInput(values.membershipQuotaEuros);

  return request<Member>("/members/create", {
    method: "POST",
    body: JSON.stringify({
      memberId: 0,
      userId: userId,
      memberNumber: 0,
      completeName: values.completeName,
      birthDate: values.birthDate,
      email: values.email,
      phone: values.phone,
      homePhone: values.homePhone || null,
      address: values.address,
      postalCode: values.postalCode,
      city: values.city,
      nif: values.nif,
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
  _initialMember: Member,
  values: MemberFormValues,
) {
  const membershipQuota =
    values.category === "ATLETA_SOCIO"
      ? 0
      : centsFromEuroInput(values.membershipQuotaEuros);

  return request<Member>(`/members/${memberId}`, {
    method: "PUT",
    body: JSON.stringify({
      completeName: values.completeName,
      birthDate: values.birthDate,
      birthplace: null,
      email: values.email,
      phone: values.phone,
      homePhone: values.homePhone.trim() || null,
      address: values.address,
      postalCode: values.postalCode,
      city: values.city,
      nif: values.nif,
      category: values.category,
      formerMember: values.formerMember,
      membershipQuota,
      billingLocation: values.billingLocation.trim() || null,
      privacyAccepted: values.privacyAccepted,
      comsAccepted: values.comsAccepted,
    }),
  });
}

export function approveMember(memberId: number) {
  const approvalDate = todayISO();
  return request<Member>(`/members/${memberId}/approve`, {
    method: "PUT",
    body: JSON.stringify({ approvalDate }),
  });
}

export function rejectMember(memberId: number) {
  return request<Member>(`/members/${memberId}/reject`, {
    method: "PUT",
  });
}

export function fetchMembershipFeeOptions(memberId: number) {
  return request<MembershipFeeOption[]>(`/members/${memberId}/fees/options`);
}

export function createMembershipFeesCheckoutSession(
  memberId: number,
  membershipFees: Array<{ season: string; month: number }>,
) {
  return request<CheckoutSession>("/payments/checkout-session", {
    method: "POST",
    body: JSON.stringify({ memberId, membershipFees }),
  });
}
