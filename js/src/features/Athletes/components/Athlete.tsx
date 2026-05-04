import { useEffect, useState } from "react";
import { CheckCircle2, PencilLine, XCircle } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import {
  deactivateAthlete,
  fetchAthleteById,
  labelForCategory,
  reactivateAthlete,
} from "..";
import type { Athlete } from "..";
import { formatDate } from "../../../shared/utils";

export default function AthletePage() {
  const { athleteId } = useParams();
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadAthlete() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const response = await fetchAthleteById(Number(athleteId));
        if (!ignore) {
          setAthlete(response);
        }
      } catch {
        if (!ignore) {
          setErrorMessage("Nao foi possivel carregar a ficha do atleta.");
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

  async function handleToggleActive() {
    if (!athlete) return;

    try {
      const updated = athlete.active
        ? await deactivateAthlete(athlete.athleteId)
        : await reactivateAthlete(athlete.athleteId);
      setAthlete(updated);
      setFeedback(
        updated.active ? "Atleta reativado com sucesso." : "Atleta desativado.",
      );
      setErrorMessage("");
    } catch {
      setErrorMessage("Nao foi possivel atualizar o estado do atleta.");
    }
  }

  if (isLoading) {
    return (
      <main className="athletes-page">
        <div className="athletes-shell">
          <p>A carregar ficha do atleta...</p>
        </div>
      </main>
    );
  }

  if (errorMessage && !athlete) {
    return (
      <main className="athletes-page">
        <div className="athletes-shell">
          <div className="feedback-message is-error">{errorMessage}</div>
          <Link className="secondary-button" to="/athletes">
            Voltar
          </Link>
        </div>
      </main>
    );
  }

  if (!athlete) return null;

  return (
    <main className="athletes-page">
      <div className="athletes-shell">
        <div className="athletes-topbar">
          <div>
            <h1>Atleta #{athlete.athleteId}</h1>
            <p>Socio #{athlete.memberId}</p>
          </div>
          <div className="athletes-actions">
            <Link className="ghost-button" to="/athletes">
              Voltar
            </Link>
            <Link className="secondary-button" to={`/athletes/${athlete.athleteId}/edit`}>
              <PencilLine size={18} />
              Atualizar
            </Link>
            <button
              className={athlete.active ? "danger-button" : "primary-button"}
              onClick={handleToggleActive}
              type="button"
            >
              {athlete.active ? (
                <>
                  <XCircle size={18} />
                  Desativar
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  Reativar
                </>
              )}
            </button>
          </div>
        </div>

        {feedback ? <div className="feedback-message is-success">{feedback}</div> : null}
        {errorMessage ? (
          <div className="feedback-message is-error">{errorMessage}</div>
        ) : null}

        <section className="page-panel">
          <div className="athletes-grid">
            <div>
              <span>Categoria</span>
              <strong>{labelForCategory(athlete.teamCategory)}</strong>
            </div>
            <div>
              <span>Estado</span>
              <strong>{athlete.active ? "Ativo" : "Inativo"}</strong>
            </div>
            <div>
              <span>Data nascimento</span>
              <strong>{formatDate(athlete.birthdate)}</strong>
            </div>
            <div>
              <span>Nacionalidade</span>
              <strong>{athlete.nationality}</strong>
            </div>
            <div>
              <span>Email</span>
              <strong>{athlete.email}</strong>
            </div>
            <div>
              <span>Telemovel</span>
              <strong>{athlete.phone}</strong>
            </div>
          </div>
        </section>

        <section className="page-panel">
          <h2 className="section-title">Documentos</h2>
          <div className="athletes-grid">
            <div>
              <span>NIF</span>
              <strong>{athlete.nif}</strong>
            </div>
            <div>
              <span>NISS</span>
              <strong>{athlete.niss}</strong>
            </div>
            <div>
              <span>Numero utente</span>
              <strong>{athlete.numeroUtente}</strong>
            </div>
            <div>
              <span>BI/CC</span>
              <strong>{athlete.bi}</strong>
            </div>
            <div>
              <span>Validade BI</span>
              <strong>{formatDate(athlete.biExpirationDate)}</strong>
            </div>
          </div>
        </section>

        <section className="page-panel">
          <h2 className="section-title">Morada</h2>
          <div className="athletes-grid">
            <div>
              <span>Morada</span>
              <strong>{athlete.address}</strong>
            </div>
            <div>
              <span>Cidade</span>
              <strong>{athlete.city}</strong>
            </div>
            <div>
              <span>Estado</span>
              <strong>{athlete.state}</strong>
            </div>
            <div>
              <span>Codigo postal</span>
              <strong>{athlete.postalCode}</strong>
            </div>
          </div>
        </section>

        <section className="page-panel">
          <h2 className="section-title">Escola</h2>
          <div className="athletes-grid">
            <div>
              <span>Escola</span>
              <strong>{athlete.school ?? "Nao indicado"}</strong>
            </div>
            <div>
              <span>Ano</span>
              <strong>{athlete.schoolYear ?? "Nao indicado"}</strong>
            </div>
            <div>
              <span>Turma</span>
              <strong>{athlete.schoolClass ?? "Nao indicado"}</strong>
            </div>
            <div>
              <span>Ultimo clube</span>
              <strong>{athlete.lastClub ?? "Nao indicado"}</strong>
            </div>
            <div>
              <span>Epoca</span>
              <strong>{athlete.season ?? "Nao indicado"}</strong>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

