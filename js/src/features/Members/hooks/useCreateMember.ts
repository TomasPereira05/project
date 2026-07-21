import { useState, type ChangeEvent, type FormEvent } from "react";
import type { TFunction } from "i18next";
import { createMember } from "../api";
import type { MemberFormValues } from "../types";
import { defaultMemberFormValues } from "../utils";
import { centsFromEuroInput } from "../../../shared/utils";
import { uploadFile } from "../../files";

export function useCreateMember(userId: number | null | undefined, role: string | undefined, t: TFunction<"translation", undefined>) {
  const [values, setValues] = useState<MemberFormValues>(defaultMemberFormValues());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [createdMemberId, setCreatedMemberId] = useState<number | null>(null);

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

    try {
      const isStaffCreation = role === "ADMIN" || role === "SECRETARIA";
      const linkedUserId = isStaffCreation ? null : userId ?? null;
      const linkedUsername = isStaffCreation ? values.accountUsername : null;
      const created = await createMember(values, linkedUserId, linkedUsername);
      if (photoFile) {
        await uploadFile("MEMBER", created.memberId, "MEMBER_PHOTO", photoFile);
      }
      setCreatedMemberId(created.memberId);
      setPhotoFile(null);
      setValues(defaultMemberFormValues());
    } catch {
      setErrorMessage(t("members.create.errors.submit"));
    } finally {
      setIsSubmitting(false);
    }
  }

  // Fecha o painel de confirmação e volta ao formulário limpo (os values já foram repostos no sucesso).
  function registerAnother() {
    setCreatedMemberId(null);
    setErrorMessage("");
  }

  return {
    createdMemberId,
    errorMessage,
    handleChange,
    handleSubmit,
    isSubmitting,
    photoFile,
    registerAnother,
    setPhotoFile,
    values,
  };
}
