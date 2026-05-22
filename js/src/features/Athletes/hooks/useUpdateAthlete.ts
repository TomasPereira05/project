import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import type { TFunction } from "i18next";
import { changeTeamCategory, fetchAllTeamCategories, getAdminDetail, updateAthlete } from "../api";
import type { AthleteAdmin, TeamCatalogCategory } from "../types";
import { stateFromAthlete, toUpdateRequest, type AthleteUpdateForm } from "../utils";

export function useUpdateAthlete(
  athleteId: string | undefined,
  t: TFunction<"translation", undefined>,
) {
  const [athlete, setAthlete] = useState<AthleteAdmin | null>(null);
  const [categories, setCategories] = useState<TeamCatalogCategory[]>([]);
  const [values, setValues] = useState<AthleteUpdateForm | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    let ignore = false;

    async function load() {
      if (!athleteId) return;
      setIsLoading(true);
      setErrorMessage("");

      try {
        const [a, cats] = await Promise.all([
          getAdminDetail(Number(athleteId)),
          fetchAllTeamCategories(),
        ]);
        if (!ignore) {
          setAthlete(a);
          setValues(stateFromAthlete(a));
          setCategories(cats);
        }
      } catch {
        if (!ignore) setErrorMessage(t("athletes.update.errors.load"));
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, [athleteId, t]);

  function handleChange(event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    if (!values) return;
    const target = event.target;
    const fieldName = target.name as keyof AthleteUpdateForm;
    if (target.type === "checkbox" && target instanceof HTMLInputElement) {
      setValues({ ...values, [fieldName]: target.checked });
      return;
    }
    if (fieldName === "teamCategoryId") {
      setValues({ ...values, teamCategoryId: Number(target.value) });
      return;
    }
    setValues({ ...values, [fieldName]: target.value });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!athlete || !values) return;

    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      let updated = athlete;

      if (values.teamCategoryId !== athlete.teamCategoryId) {
        updated = await changeTeamCategory(athlete.athleteId, values.teamCategoryId);
      }

      updated = await updateAthlete(athlete.athleteId, toUpdateRequest(values));

      setAthlete(updated);
      setValues(stateFromAthlete(updated));
      setSuccessMessage(t("athletes.update.success"));
    } catch {
      setErrorMessage(t("athletes.update.errors.submit"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    athlete,
    categories,
    errorMessage,
    handleChange,
    handleSubmit,
    isLoading,
    isSubmitting,
    successMessage,
    values,
  };
}
