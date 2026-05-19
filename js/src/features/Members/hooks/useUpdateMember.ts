import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import type { TFunction } from "i18next";
import { fetchMember, updateMember } from "../api";
import type { Member, MemberFormValues } from "../types";
import { defaultMemberFormValues } from "../utils";

export function useUpdateMember(
  memberId: string | undefined,
  canLoad: boolean,
  t: TFunction<"translation", undefined>,
) {
  const [member, setMember] = useState<Member | null>(null);
  const [values, setValues] = useState<MemberFormValues>(defaultMemberFormValues());
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadMember() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const response = await fetchMember(Number(memberId));
        if (!ignore) {
          setMember(response);
          setValues(defaultMemberFormValues(response));
        }
      } catch {
        if (!ignore) {
          setErrorMessage(t("members.update.errors.load"));
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    if (memberId && canLoad) {
      loadMember();
    }

    return () => {
      ignore = true;
    };
  }, [memberId, canLoad, t]);

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

    if (!member) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const updated = await updateMember(member.memberId, member, values);
      setMember(updated);
      setSuccessMessage(t("members.update.success"));
    } catch {
      setErrorMessage(t("members.update.errors.submit"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    errorMessage,
    handleChange,
    handleSubmit,
    isLoading,
    isSubmitting,
    successMessage,
    values,
  };
}
