import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import type { TFunction } from "i18next";
import { createAthlete, fetchAllTeamCategories } from "../api";
import type { TeamCatalogCategory } from "../types";
import { initialRegisterValues, toAthleteInput, type RegisterValues } from "../utils";
import { HttpError } from "../../../shared/types/HttpError";
import { useAuth } from "../../../shared/hooks/useAuth";
import { todayISO } from "../../../shared/utils";
import { uploadFile } from "../../files";

export function useCreateAthlete(t: TFunction<"translation", undefined>) {
  const auth = useAuth();
  const alreadyHasMember = auth.activeMemberId != null;
  const [values, setValues] = useState<RegisterValues>(initialRegisterValues);
  const [categories, setCategories] = useState<TeamCatalogCategory[]>([]);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    let ignore = false;
    fetchAllTeamCategories()
      .then((cats) => {
        if (ignore) return;
        const active = cats.filter((c) => c.active);
        setCategories(active);
        if (active.length > 0) {
          setValues((current) =>
            current.teamCategoryId === "" ? { ...current, teamCategoryId: String(active[0].teamId) } : current,
          );
        }
      })
      .catch(() => {
        if (!ignore) setErrorMessage(t("athletes.register.errors.loadCategories"));
      });
    return () => {
      ignore = true;
    };
  }, [t]);

  function handleChange(
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) {
    const target = event.target;
    const nextValue =
      target instanceof HTMLInputElement && target.type === "checkbox"
        ? target.checked
        : target.value;
    setValues((current) => {
      const next = { ...current, [target.name]: nextValue } as RegisterValues;
      // Quando marca "sou eu", pré-preenche email com o do user autenticado (se vazio).
      if (target.name === "isSelfRegistration" && nextValue === true && !current.email && auth.email) {
        next.email = auth.email;
      }
      return next;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    if (!values.privacyAccepted) {
      setErrorMessage(t("athletes.register.errors.privacy"));
      setIsSubmitting(false);
      return;
    }
    if (!values.teamCategoryId) {
      setErrorMessage(t("athletes.register.errors.selectCategory"));
      setIsSubmitting(false);
      return;
    }
    if (values.birthDate && values.birthDate >= todayISO()) {
      setErrorMessage(t("athletes.register.errors.birthDate"));
      setIsSubmitting(false);
      return;
    }
    if (values.biExpirationDate && values.biExpirationDate <= todayISO()) {
      setErrorMessage(t("athletes.register.errors.biValidity"));
      setIsSubmitting(false);
      return;
    }
    if (values.isSelfRegistration && alreadyHasMember) {
      setErrorMessage(t("athletes.register.errors.selfAlreadyMember"));
      setIsSubmitting(false);
      return;
    }
    try {
      const created = await createAthlete(toAthleteInput(values));
      // A foto segue num request separado: se falhar, o atleta JÁ está criado —
      // mostra-se sucesso com aviso, nunca "falhou" (pode adicionar-se na ficha).
      let photoFailed = false;
      if (photoFile) {
        try {
          await uploadFile("ATHLETE", created.athleteId, "ATHLETE_PHOTO", photoFile);
        } catch {
          photoFailed = true;
        }
      }
      setSuccessMessage(
        photoFailed ? t("athletes.register.successPhotoFailed") : t("athletes.register.success"),
      );
      setPhotoFile(null);
      setValues({ ...initialRegisterValues, teamCategoryId: values.teamCategoryId });
    } catch (error) {
      const fallback = t("athletes.register.errors.submit");
      const message = error instanceof HttpError ? error.message || fallback : fallback;
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    alreadyHasMember,
    categories,
    errorMessage,
    handleChange,
    handleSubmit,
    isSubmitting,
    photoFile,
    setPhotoFile,
    successMessage,
    values,
  };
}