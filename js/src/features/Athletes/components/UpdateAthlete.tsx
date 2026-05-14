import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, ShieldAlert } from "lucide-react";
import {
  changeTeamCategory,
  fetchAllTeamCategories,
  getAdminDetail,
  updateAthlete,
  type AthleteAdmin,
  type AthleteUpdateRequest,
  type TeamCatalogCategory,
} from "..";
import Header from "../../../shared/components/Header";
import Footer from "../../../shared/components/Footer";
import { HERO_IMG_SRC } from "../../../shared/config/config";

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
  const { athleteId } = useParams();
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
        if (!ignore) setErrorMessage("Não foi possível carregar o atleta para atualização.");
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, [athleteId]);

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
      setSuccessMessage("Dados do atleta atualizados com sucesso.");
    } catch {
      setErrorMessage("Não foi possível atualizar esta ficha de atleta.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading || !athlete || !values) {
    return (
      <>
        <Header />
        <main className="member-form-page">
          <div
            className="member-form-bg"
            style={{ backgroundImage: `url(${HERO_IMG_SRC})` }}
          />
          <div className="member-form-overlay" />
          <div className="member-form-container">
            <div className="member-card-padded">
              <div className="member-form-loading-container">
                <div className="member-form-loading-spinner"></div>
                <p>A carregar formulário de atualização...</p>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="member-form-page">
        <div
          className="member-form-bg"
          style={{ backgroundImage: `url(${HERO_IMG_SRC})` }}
        />
        <div className="member-form-overlay" />

        <div className="member-form-container">
          <div className="member-card-padded">
            <div className="member-card-header">
              <div>
                <h2 className="member-title">Atualizar atleta</h2>
                <p className="member-desc">
                  {athlete.member.completeName} · Sócio #{athlete.member.memberNumber} · Atleta #{athlete.athleteId}
                </p>
              </div>
              <Link className="member-btn-back" to={`/athletes/${athlete.athleteId}`}>
                <ArrowLeft size={18} />
                Voltar à ficha
              </Link>
            </div>

            {errorMessage && (
              <div className="member-alert-error">
                <ShieldAlert size={20} className="member-alert-icon-error" />
                <p className="member-alert-text">{errorMessage}</p>
              </div>
            )}

            {successMessage && (
              <div className="member-alert-success">
                <CheckCircle2 size={20} className="member-alert-icon-success" />
                <p className="member-alert-text">{successMessage}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              <section className="space-y-4">
                <h3 className="font-heading text-lg text-text-primary uppercase tracking-tight pb-2 border-b border-border">
                  Dados desportivos
                </h3>
                <div className="member-form-grid">
                  <div className="member-input-group">
                    <label className="member-label">Escalão</label>
                    <select className="member-input" name="teamCategoryId" value={values.teamCategoryId} onChange={handleChange}>
                      {categories.map((c) => (
                        <option key={c.teamId} value={c.teamId}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="member-input-group">
                    <label className="member-label">Número</label>
                    <input className="member-input" type="number" name="jerseyNumber" value={values.jerseyNumber} onChange={handleChange} placeholder="Ex: 10" />
                  </div>
                  <div className="member-input-group">
                    <label className="member-label">Posição</label>
                    <input className="member-input" name="position" value={values.position} onChange={handleChange} placeholder="Ex: Avançado" />
                  </div>
                  <div className="member-input-group">
                    <label className="member-label">Foto (URL)</label>
                    <input className="member-input" name="photoUrl" value={values.photoUrl} onChange={handleChange} placeholder="https://..." />
                  </div>
                  <div className="member-input-group">
                    <label className="member-label">Último clube</label>
                    <input className="member-input" name="lastClub" value={values.lastClub} onChange={handleChange} placeholder="Clube anterior" />
                  </div>
                  <div className="member-input-group">
                    <label className="member-label">Época</label>
                    <input className="member-input" name="season" value={values.season} onChange={handleChange} placeholder="Ex: 2025/2026" />
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="font-heading text-lg text-text-primary uppercase tracking-tight pb-2 border-b border-border">
                  Dados escolares
                </h3>
                <div className="member-form-grid">
                  <div className="member-input-group member-input-group-span">
                    <label className="member-label">Escola</label>
                    <input className="member-input" name="school" value={values.school} onChange={handleChange} placeholder="Escola (opcional)" />
                  </div>
                  <div className="member-input-group">
                    <label className="member-label">Ano</label>
                    <input className="member-input" name="schoolYear" value={values.schoolYear} onChange={handleChange} placeholder="Ex: 8º ano" />
                  </div>
                  <div className="member-input-group">
                    <label className="member-label">Turma</label>
                    <input className="member-input" name="schoolClass" value={values.schoolClass} onChange={handleChange} placeholder="Ex: B" />
                  </div>
                </div>

                <label className="member-checkbox-group group">
                  <div className="member-checkbox-offset">
                    <input type="checkbox" className="member-checkbox" name="hasFamilyInClub" checked={values.hasFamilyInClub} onChange={handleChange} />
                  </div>
                  <div>
                    <span className="member-checkbox-title">Tem família no clube</span>
                  </div>
                </label>
              </section>

              <div className="member-form-actions">
                <button className="member-btn-primary" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "A guardar..." : "Guardar alterações"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
