import type { Member, MemberFormValues } from "../types";
import { euroInputFromCents } from "../../../shared/utils";

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
    nif: member?.nif ?? "",
    category: member?.category ?? "SOCIO",
    membershipQuotaEuros:
      member && member.membershipQuota > 0
        ? euroInputFromCents(member.membershipQuota)
        : "1.50",
    formerMember: member?.formerMember ?? false,
    billingLocation: member?.billingLocation ?? "",
    privacyAccepted: member?.privacyAccepted ?? false,
    comsAccepted: member?.comsAccepted ?? false,
    accountUsername: "",
  };
}
