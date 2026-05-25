import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, ShieldAlert } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  changeTeamCategory,
  fetchAllTeamCategories,
  getAdminDetail,
  updateAthlete,
  type AthleteAdmin,
  type AthleteUpdateRequest,
  type TeamCatalogCategory,
} from "..";
import AthletePageBackground from "./AthletePageBackground";

type FormState = {
  teamCategoryId: number;
  jerseyNumber: string;
  position: string;
  photoUrl: string;
  school: string;
  schoolYear: string;
  schoolClass: string;
  lastClub: string;
  season: string;
  hasFamilyInClub: boolean;
};

function stateFromAthlete(a: AthleteAdmin): FormState {
  return {
    teamCategoryId: a.teamCategoryId,
    jerseyNumber: a.jerseyNumber !== null ? String(a.jerseyNumber) : "",
    position: a.position ?? "",
    photoUrl: a.photoUrl ?? "",
    school: a.school ?? "",
    schoolYear: a.schoolYear ?? "",
    schoolClass: a.schoolClass ?? "",
    lastClub: a.lastClub ?? "",
    season: a.season ?? "",
    hasFamilyInClub: a.hasFamilyInClub,
  };
}

function toUpdateRequest(values: FormState): AthleteUpdateRequest {
  const parsedJersey = values.jerseyNumber.trim() === "" ? null : Number(values.jerseyNumber);
  return {
    jerseyNumber: Number.isFinite(parsedJersey) ? (parsedJersey as number) : null,
    position: values.position.trim() || null,
    photoUrl: values.photoUrl.trim() || null,
    school: values.school.trim() || null,
    schoolYear: values.schoolYear.trim() || null,
    schoolClass: values.schoolClass.trim() || null,
    lastClub: values.lastClub.trim() || null,
    season: values.season.trim() || null,
    hasFamilyInClub: values.hasFamilyInClub,
  };
}

export default function UpdateAthlete() {
  const { t } = useTranslation();
  const { athleteId } = useParams();
  const location = useLocation();
  const athleteBasePath = location.pathname.startsWith("/admin") ? "/admin/athletes" : "/athletes";
  const [athlete, setAthlete] = useState<AthleteAdmin | null>(null);
  const [categories, setCategories] = useState<TeamCatalogCategory[]>([]);
  const [values, setValues] = useState<FormState | null>(null);
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
    const fieldName = target.name as keyof FormState;
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

  if (isLoading || !athlete || !values) {
    return (
      <>
        <main className="athlete-form-page">
          <AthletePageBackground />
          <div className="athlete-form-container">
            <div className="athlete-card-padded">
              <div className="athlete-form-loading-container">
                <div className="athlete-form-loading-spinner"></div>
                <p>{t("athletes.update.loading")}</p>
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <main className="athlete-form-page">
        <AthletePageBackground />

        <div className="athlete-form-container">
          <div className="athlete-card-padded">
            <div className="athlete-card-header">
              <div>
                <h2 className="athlete-title">{t("athletes.update.title")}</h2>
                <p className="athlete-desc">
                  {t("athletes.update.description", { name: athlete.member.completeName, memberNumber: athlete.member.memberNumber, athleteId: athlete.athleteId })}
                </p>
              </div>
              <Link className="athlete-btn-back" to={`${athleteBasePath}/${athlete.athleteId}`}>
                <ArrowLeft size={18} />
                {t("athletes.update.backToProfile")}
              </Link>
            </div>

            {errorMessage && (
              <div className="athlete-alert-error">
                <ShieldAlert size={20} className="athlete-alert-icon-error" />
                <p className="athlete-alert-text">{errorMessage}</p>
              </div>
            )}

            {successMessage && (
              <div className="athlete-alert-success">
                <CheckCircle2 size={20} className="athlete-alert-icon-success" />
                <p className="athlete-alert-text">{successMessage}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              <section className="space-y-4">
                <h3 className="font-heading text-lg text-text-primary uppercase tracking-tight pb-2 border-b border-border">
                  {t("athletes.detail.sections.sportsData")}
                </h3>
                <div className="athlete-form-grid">
                  <div className="athlete-input-group">
                    <label className="athlete-label">{t("athletes.fields.category")}</label>
                    <select className="athlete-input" name="teamCategoryId" value={values.teamCategoryId} onChange={handleChange}>
                      {categories.map((c) => (
                        <option key={c.teamId} value={c.teamId}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="athlete-input-group">
                    <label className="athlete-label">{t("athletes.fields.number")}</label>
                    <input className="athlete-input" type="number" name="jerseyNumber" value={values.jerseyNumber} onChange={handleChange} placeholder={t("athletes.update.placeholders.number")} />
                  </div>
                  <div className="athlete-input-group">
                    <label className="athlete-label">{t("athletes.fields.position")}</label>
                    <input className="athlete-input" name="position" value={values.position} onChange={handleChange} placeholder={t("athletes.update.placeholders.position")} />
                  </div>
                  <div className="athlete-input-group">
                    <label className="athlete-label">{t("athletes.fields.photoUrl")}</label>
                    <input className="athlete-input" name="photoUrl" value={values.photoUrl} onChange={handleChange} placeholder="https://..." />
                  </div>
                  <div className="athlete-input-group">
                    <label className="athlete-label">{t("athletes.fields.lastClub")}</label>
                    <input className="athlete-input" name="lastClub" value={values.lastClub} onChange={handleChange} placeholder={t("athletes.update.placeholders.previousClub")} />
                  </div>
                  <div className="athlete-input-group">
                    <label className="athlete-label">{t("athletes.fields.season")}</label>
                    <input className="athlete-input" name="season" value={values.season} onChange={handleChange} placeholder={t("athletes.register.placeholders.season")} />
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="font-heading text-lg text-text-primary uppercase tracking-tight pb-2 border-b border-border">
                  {t("athletes.detail.sections.schoolData")}
                </h3>
                <div className="athlete-form-grid">
                  <div className="athlete-input-group athlete-input-group-span">
                    <label className="athlete-label">{t("athletes.fields.school")}</label>
                    <input className="athlete-input" name="school" value={values.school} onChange={handleChange} placeholder={t("athletes.update.placeholders.school")} />
                  </div>
                  <div className="athlete-input-group">
                    <label className="athlete-label">{t("athletes.fields.schoolYear")}</label>
                    <input className="athlete-input" name="schoolYear" value={values.schoolYear} onChange={handleChange} placeholder={t("athletes.register.placeholders.schoolYear")} />
                  </div>
                  <div className="athlete-input-group">
                    <label className="athlete-label">{t("athletes.fields.schoolClass")}</label>
                    <input className="athlete-input" name="schoolClass" value={values.schoolClass} onChange={handleChange} placeholder={t("athletes.register.placeholders.schoolClass")} />
                  </div>
                </div>

                <label className="athlete-checkbox-group group">
                  <div className="athlete-checkbox-offset">
                    <input type="checkbox" className="athlete-checkbox" name="hasFamilyInClub" checked={values.hasFamilyInClub} onChange={handleChange} />
                  </div>
                  <div>
                    <span className="athlete-checkbox-title">{t("athletes.register.family.title")}</span>
                  </div>
                </label>
              </section>

              <div className="athlete-form-actions">
                <button className="athlete-btn-primary" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? t("athletes.common.saving") : t("athletes.update.submit")}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </>
  );
}
