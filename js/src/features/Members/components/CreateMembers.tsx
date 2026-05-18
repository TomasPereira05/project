import { useState, type ChangeEvent, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import {
  createMember,
  defaultMemberFormValues,
  type MemberFormValues,
} from "..";
import { MemberForm } from "./MemberForm";
import { HERO_IMG_SRC } from "../../../shared/config/config";
import { useAuth } from "../../../shared/hooks/useAuth";
import { centsFromEuroInput } from "../../../shared/utils";

export default function CreateMembers() {
  const { t } = useTranslation();
  const [values, setValues] = useState<MemberFormValues>(defaultMemberFormValues());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const { id, role } = useAuth();

  function handleChange(
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) {
    const target = event.target;
    const nextValue =
      target instanceof HTMLInputElement && target.type === "checkbox"
        ? target.checked
        : target.value;

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
      const userId = (role === "ADMIN" ? null : id ?? null);
      const created = await createMember(values, userId);
      setSuccessMessage(
        t("members.create.success", { memberNumber: created.memberNumber }),
      );
      setValues(defaultMemberFormValues());
    } catch {
      setErrorMessage(t("members.create.errors.submit"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <main className="member-form-page">
        <div
            className="member-form-bg"
            style={{ backgroundImage: `url(${HERO_IMG_SRC})` }}
        />
        <div className="member-form-overlay" />
        
        <div className="member-form-container">
          <MemberForm
            title={t("members.create.title")}
            description={t("members.create.description")}
            values={values}
            onChange={handleChange}
            onSubmit={handleSubmit}
            submitLabel={t("members.create.submit")}
            isSubmitting={isSubmitting}
            errorMessage={errorMessage}
            successMessage={successMessage}
          />
        </div>
      </main>
    </>
  );
}
