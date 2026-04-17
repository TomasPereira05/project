import { BASE_URL } from "@/config";
import type { Member, MemberFormValues } from "./types";

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
  return request<Member[]>("/members");
}

export function fetchMember(memberId: number) {
  return request<Member>(`/members/${memberId}`);
}

export function createMember(values: MemberFormValues) {
  const today = new Date().toISOString().slice(0, 10);
  const membershipQuota = values.category === "ATLETA_SOCIO" ? 0 : 150;

  return request<Member>("/members/create", {
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
    `/members/${memberId}?${search.toString()}`,
    { method: "PUT" },
  );

  if (initialMember.category !== values.category) {
    return request<Member>(`/members/${memberId}/category`, {
      method: "PUT",
      body: JSON.stringify({ category: values.category }),
    });
  }

  return updatedMember;
}

export function approveMember(memberId: number) {
  const approvalDate = new Date().toISOString().slice(0, 10);
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
