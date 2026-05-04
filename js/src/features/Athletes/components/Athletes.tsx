import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchActiveAthletes } from "..";
import type { Athlete } from "..";
import { labelForCategory } from "..";

export default function Athletes() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

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

  return (
    <main className="athletes-page">
      <div className="athletes-shell">
        <header className="athletes-topbar">
          <div>
            <p>Jagoz</p>
            <h1>Atletas ativos</h1>
            <p>Lista simples com os atletas ativos e respetiva categoria.</p>
          </div>
          <Link className="secondary-button" to="/">
            Home
          </Link>
        </header>

        {errorMessage ? (
          <div className="feedback-message is-error">{errorMessage}</div>
        ) : null}

        {isLoading ? <p>A carregar atletas...</p> : null}

        {!isLoading && !errorMessage ? (
          <div className="athletes-list">
            {athletes.length === 0 ? (
              <div className="empty-card">Sem atletas ativos.</div>
            ) : (
              athletes.map((athlete) => (
                <article className="athletes-card" key={athlete.athleteId}>
                  <div>
                    <strong>Atleta #{athlete.athleteId}</strong>
                    <p>Socio #{athlete.memberId}</p>
                  </div>
                  <div className="athletes-meta">
                    <Link
                      className="athletes-chip"
                      to={`/athletes/category/${athlete.teamCategory}`}
                    >
                      {labelForCategory(athlete.teamCategory)}
                    </Link>
                    <span className="athletes-chip">{athlete.city}</span>
                  </div>
                  <Link
                    className="ghost-button"
                    to={`/athletes/${athlete.athleteId}`}
                  >
                    Ver ficha
                  </Link>
                </article>
              ))
            )}
          </div>
        ) : null}
      </div>
    </main>
  );
}

