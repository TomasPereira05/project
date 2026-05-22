import { useState, type ChangeEvent, type FormEvent } from "react";
import type { TFunction } from "i18next";
import { createMember } from "../api";
import type { MemberFormValues } from "../types";
import { defaultMemberFormValues } from "../utils";
import { centsFromEuroInput } from "../../../shared/utils";

export function useCreateMember(userId: number | null | undefined, role: string | undefined, t: TFunction<"translation", undefined>) {
  const [values, setValues] = useState<MemberFormValues>(defaultMemberFormValues());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  function handleChange(event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const target = event.target;
    const nextValue = target instanceof HTMLInputElement && target.type === "checkbox" ? target.checked : target.value;

    setValues((current) => ({
      ...current,
      [target.name]: nextValue,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!values.privacyAccepted) {
      setErrorMessage(t("members.create.errors.privacy"));
      return;
    }

    if (values.category !== "ATLETA_SOCIO") {
      const quotaInCents = centsFromEuroInput(values.membershipQuotaEuros);
      if (!Number.isFinite(quotaInCents) || quotaInCents < 150) {
        setErrorMessage(t("members.create.errors.minimumQuota"));
        return;
      }
    }

    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const linkedUserId = role === "ADMIN" ? null : userId ?? null;
      await createMember(values, linkedUserId);
      setSuccessMessage(t("members.create.success"));
      setValues(defaultMemberFormValues());
    } catch {
      setErrorMessage(t("members.create.errors.submit"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    errorMessage,
    handleChange,
    handleSubmit,
    isSubmitting,
    successMessage,
    values,
  };
}
