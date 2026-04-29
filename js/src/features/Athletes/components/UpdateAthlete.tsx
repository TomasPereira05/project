import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useParams } from "react-router-dom";
import {
  changeTeamCategory,
  defaultAthleteFormValues,
  fetchAthleteById,
  updateSchoolInfo,
  type Athlete,
  type AthleteFormValues,
} from "..";
import { AthleteForm } from "./AthleteForm";

export default function UpdateAthlete() {
  const { athleteId } = useParams();
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [values, setValues] = useState<AthleteFormValues>(defaultAthleteFormValues());
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadAthlete() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const response = await fetchAthleteById(Number(athleteId));
        if (!ignore) {
          setAthlete(response);
          setValues(defaultAthleteFormValues(response));
        }
      } catch {
        if (!ignore) {
          setErrorMessage("Nao foi possivel carregar o atleta para atualizacao.");
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    if (athleteId) {
      loadAthlete();
    }

    return () => {
      ignore = true;
    };
  }, [athleteId]);

  function handleChange(
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) {
    const target = event.target;

    setValues((current) => ({
      ...current,
      [target.name]: target.value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!athlete) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      let updated = athlete;

      if (values.teamCategory !== athlete.teamCategory) {
        updated = await changeTeamCategory(updated.athleteId, values.teamCategory);
      }

      const currentSchool = updated.school ?? "";
      const currentSchoolYear = updated.schoolYear ?? "";
      const currentSchoolClass = updated.schoolClass ?? "";

      const schoolChanged =
        values.school !== currentSchool ||
        values.schoolYear !== currentSchoolYear ||
        values.schoolClass !== currentSchoolClass;

      if (schoolChanged) {
        updated = await updateSchoolInfo(
          updated.athleteId,
          values.school,
          values.schoolYear,
          values.schoolClass,
        );
      }

      setAthlete(updated);
      setValues(defaultAthleteFormValues(updated));
      setSuccessMessage("Dados do atleta atualizados com sucesso.");
    } catch {
      setErrorMessage("Nao foi possivel atualizar esta ficha de atleta.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="athletes-page">
      <div className="athletes-shell">
        {isLoading ? (
          <div className="page-panel">
            <p>A carregar formulario de atualizacao...</p>
          </div>
        ) : (
          <AthleteForm
            title="Atualizar atleta"
            description="Formulario pre-preenchido para rever categoria e dados escolares."
            values={values}
            onChange={handleChange}
            onSubmit={handleSubmit}
            submitLabel="Guardar alteracoes"
            isSubmitting={isSubmitting}
            errorMessage={errorMessage}
            successMessage={successMessage}
            showBackendNotice
          />
        )}
      </div>
    </main>
  );
}

