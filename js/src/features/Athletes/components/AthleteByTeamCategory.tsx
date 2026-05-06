import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import {
  fetchActiveAthletes,
  isTeamCategory,
  labelForCategory,
  type Athlete,
  type TeamCategory,
} from "..";
import Header from "../../../shared/components/Header";
import Footer from "../../../shared/components/Footer";
import { HERO_IMG_SRC } from "../../../shared/config/config";

export default function AthleteByTeamCategory() {
  const { teamCategory } = useParams();
  const navigate = useNavigate();
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const category = useMemo(() => {
    if (!teamCategory) return null;
    return isTeamCategory(teamCategory) ? (teamCategory as TeamCategory) : null;
  }, [teamCategory]);

  useEffect(() => {
    let ignore = false;

    async function loadAthletes() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const response = await fetchActiveAthletes();
        if (!ignore) {
          setAthletes(response);
        }
      } catch {
        if (!ignore) {
          setErrorMessage("Não foi possível carregar a lista de atletas.");
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadAthletes();

    return () => {
      ignore = true;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!category) return [];
    return athletes.filter((athlete) => athlete.teamCategory === category);
  }, [athletes, category]);

  return (
    <>
      <Header />
      <main className="member-form-page">
        <div
          className="member-form-bg"
          style={{ backgroundImage: `url(${HERO_IMG_SRC})` }}
        />
        <div className="member-form-overlay" />

        <div className="relative z-20 flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="member-card-padded">
            <div className="member-card-header">
              <div>
                <h2 className="member-title">
                  {category
                    ? `Atletas - ${labelForCategory(category)}`
                    : "Categoria desconhecida"}
                </h2>
                <p className="member-desc">Lista filtrada por categoria de equipa.</p>
              </div>

              <button onClick={() => navigate(-1)} className="member-btn-back">
                <ArrowLeft size={18} />
                Voltar
              </button>
            </div>

            {!category && (
              <div className="member-alert-error">
                <ShieldAlert size={20} className="text-red-500" />
                <p className="text-sm font-medium">A categoria indicada não existe.</p>
              </div>
            )}

            {errorMessage && (
              <div className="member-alert-error">
                <ShieldAlert size={20} className="text-red-500" />
                <p className="text-sm font-medium">{errorMessage}</p>
              </div>
            )}

            {isLoading && (
              <div className="member-loading-container py-8">
                <div className="member-loading-spinner" />
                <p className="member-loading-text">A carregar atletas...</p>
              </div>
            )}

            {!isLoading && !errorMessage && category && (
              <>
                {filtered.length === 0 ? (
                  <div className="border border-dashed border-border rounded-lg p-8 text-center text-text-secondary">
                    Sem atletas ativos nesta categoria.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((athlete) => (
                      <article
                        key={athlete.athleteId}
                        className="bg-white border border-border rounded-xl p-5 flex flex-col gap-3 hover:shadow-md transition-shadow"
                      >
                        <div>
                          <strong className="font-heading text-lg text-text-primary">
                            Atleta #{athlete.athleteId}
                          </strong>
                          <p className="text-sm text-text-secondary">
                            Sócio #{athlete.memberId}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <span className="member-category-badge">
                            {labelForCategory(athlete.teamCategory)}
                          </span>
                          <span className="member-category-badge">{athlete.city}</span>
                        </div>
                        <Link
                          to={`/athletes/${athlete.athleteId}`}
                          className="member-action-btn self-start"
                        >
                          Ver ficha
                        </Link>
                      </article>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {!isLoading && !errorMessage && category && (
            <div className="member-card-padded">
              <h3 className="font-heading text-lg text-text-primary uppercase tracking-tight pb-2 border-b border-border mb-4">
                Horários de treino
              </h3>
              <p className="text-text-secondary">Sem horários definidos.</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
