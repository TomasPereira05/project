import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  fetchActiveAthletes,
  isTeamCategory,
  labelForCategory,
  type Athlete,
  type TeamCategory,
} from "..";
import Header from "../../../shared/components/Header";

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
          setErrorMessage("Nao foi possivel carregar a lista de atletas.");
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
      <main className="athletes-page">
        <div className="athletes-shell">
          <header className="athletes-topbar">
            <div>
              <p>Jagoz</p>
              <h1>
                {category ? `Atletas - ${labelForCategory(category)}` : "Categoria desconhecida"}
              </h1>
              <p>Lista filtrada por categoria de equipa.</p>
            </div>

            <div className="athletes-actions">
              <button className="ghost-button" onClick={() => navigate(-1)}>
                Voltar
              </button>
            </div>
          </header>

          {!category ? (
            <div className="feedback-message is-error">
              A categoria indicada nao existe.
            </div>
          ) : null}

          {errorMessage ? (
            <div className="feedback-message is-error">{errorMessage}</div>
          ) : null}

          {isLoading ? <p>A carregar atletas...</p> : null}

          {!isLoading && !errorMessage && category ? (
            <>
              <div className="athletes-list">
                {filtered.length === 0 ? (
                  <div className="empty-card">Sem atletas ativos nesta categoria.</div>
                ) : (
                  filtered.map((athlete) => (
                    <article className="athletes-card" key={athlete.athleteId}>
                      <div>
                        <strong>Atleta #{athlete.athleteId}</strong>
                        <p>Socio #{athlete.memberId}</p>
                      </div>
                      <div className="athletes-meta">
                        <span className="athletes-chip">{labelForCategory(athlete.teamCategory)}</span>
                        <span className="athletes-chip">{athlete.city}</span>
                      </div>
                      <Link className="ghost-button" to={`/athletes/${athlete.athleteId}`}>
                        Ver ficha
                      </Link>
                    </article>
                  ))
                )}
              </div>

              <section className="page-panel">
                <h2 className="section-title">Horários de treino</h2>
                <p>Sem horários definidos.</p>
              </section>
            </>
          ) : null}
        </div>
      </main>
    </>
  );
}

