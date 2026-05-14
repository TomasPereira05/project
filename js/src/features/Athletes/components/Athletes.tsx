import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, ChevronDown, ChevronLeft, ChevronRight, Plus, ShieldAlert, Users } from "lucide-react";
import { listAllAdmin } from "..";
import type { AthleteAdmin, AthleteStatus } from "..";
import Header from "../../../shared/components/Header";
import Footer from "../../../shared/components/Footer";
import { formatDate } from "../../../shared/utils";

const PAGE_SIZE = 8;

function statusLabel(status: AthleteStatus): string {
  switch (status) {
    case "ATIVO":
      return "Ativo";
    case "PENDENTE":
      return "Pendente";
    case "INATIVO":
      return "Inativo";
    case "REJEITADO":
      return "Rejeitado";
  }
}

function statusColor(status: AthleteStatus): string {
  switch (status) {
    case "ATIVO":
      return "member-status-active";
    case "PENDENTE":
      return "member-status-pending";
    case "INATIVO":
      return "member-status-inactive";
    case "REJEITADO":
      return "member-status-rejected";
  }
}

export default function Athletes() {
  const [athletes, setAthletes] = useState<AthleteAdmin[]>([]);
  const [page, setPage] = useState(1);
  const [totalAthletes, setTotalAthletes] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [pendingOpen, setPendingOpen] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function loadAthletes() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const response = await listAllAdmin(page, PAGE_SIZE);
        if (!ignore) {
          setAthletes(response.items);
          setTotalAthletes(response.total);
          setTotalPages(response.totalPages);
        }
      } catch {
        if (!ignore) {
          setErrorMessage("Não foi possível carregar a lista de atletas.");
        }
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    loadAthletes();
    return () => {
      ignore = true;
    };
  }, [page]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const pendingAthletes = useMemo(
    () => athletes.filter((a) => a.status === "PENDENTE"),
    [athletes],
  );

  return (
    <>
      <Header />
      <main className="member-page">
        <div className="member-container">
          <header className="member-header-container">
            <div>
              <div className="member-kicker">
                <Users size={18} />
                <span>Administração</span>
              </div>
              <h1 className="member-page-title">Gestão de Atletas</h1>
              <p className="member-page-desc">
                Aprove ou rejeite inscrições pendentes e consulte o estado de cada atleta.
              </p>
            </div>
            <div className="member-header-actions">
              <Link to="/athletes/register" className="member-primary-link-compact">
                <Plus size={18} />
                Nova inscrição
              </Link>
            </div>
          </header>

          {errorMessage && (
            <div className="member-alert-error">
              <ShieldAlert size={20} className="member-alert-icon-error" />
              <p className="member-alert-text">{errorMessage}</p>
            </div>
          )}

          <section className="member-pending-card">
            <button
              className="member-pending-toggle"
              onClick={() => setPendingOpen((current) => !current)}
              type="button"
            >
              <div className="member-pending-summary">
                <div className="member-pending-icon">
                  <Bell size={20} />
                </div>
                <span className="member-pending-title">Atletas Pendentes</span>
                <span className="member-pending-count">{pendingAthletes.length}</span>
              </div>
              <ChevronDown
                size={20}
                className={`member-pending-chevron ${pendingOpen ? "member-pending-chevron-open" : ""}`}
              />
            </button>

            {pendingOpen && (
              <div className="member-pending-panel">
                {pendingAthletes.length === 0 ? (
                  <p className="member-pending-empty">Sem inscrições pendentes nesta página.</p>
                ) : (
                  <div className="member-pending-list">
                    {pendingAthletes.map((athlete) => (
                      <div className="member-pending-item" key={athlete.athleteId}>
                        <div>
                          <div className="member-pending-item-head">
                            <span className="member-pending-number">#{athlete.member.memberNumber}</span>
                            <span className="member-pagination-strong">{athlete.member.completeName}</span>
                          </div>
                          <div className="member-pending-meta">
                            <span>Registo em {formatDate(athlete.member.registrationDate)}</span>
                            <span>•</span>
                            <span>{athlete.teamCategoryLabel}</span>
                          </div>
                        </div>
                        <Link className="member-btn-evaluate" to={`/athletes/${athlete.athleteId}`}>
                          Avaliar Pedido
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>

          <section className="member-table-wrapper">
            {isLoading ? (
              <div className="member-table-loading">
                <div className="member-loading-spinner"></div>
                <p className="member-loading-text">A carregar atletas...</p>
              </div>
            ) : !errorMessage && (
              <>
                <div className="member-table-scroll">
                  <table className="member-table-wide">
                    <thead className="member-table-head">
                      <tr>
                        <th className="member-th">Nº Sócio</th>
                        <th className="member-th">Nome</th>
                        <th className="member-th">Escalão</th>
                        <th className="member-th">Estado</th>
                        <th className="member-th">Registo / Cidade</th>
                        <th className="member-th-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="member-table-body">
                      {athletes.map((athlete) => (
                        <tr className="member-tr-interactive" key={athlete.athleteId}>
                          <td className="member-td-number">#{athlete.member.memberNumber}</td>
                          <td className="member-td">
                            <div className="member-pagination-strong">{athlete.member.completeName}</div>
                            <div className="member-cell-email">{athlete.member.email}</div>
                          </td>
                          <td className="member-td">
                            <span className="member-category-badge">{athlete.teamCategoryLabel}</span>
                          </td>
                          <td className="member-td">
                            <span className={`member-status-badge ${statusColor(athlete.status)}`}>
                              {statusLabel(athlete.status)}
                            </span>
                          </td>
                          <td className="member-td">
                            <div className="member-cell-primary">{formatDate(athlete.member.registrationDate)}</div>
                            <div className="member-helper-text">{athlete.member.city}</div>
                          </td>
                          <td className="member-td-right">
                            <div className="member-row-actions">
                              <Link
                                to={`/athletes/${athlete.athleteId}/edit`}
                                className="member-btn-table-edit"
                              >
                                Editar
                              </Link>
                              <Link
                                to={`/athletes/${athlete.athleteId}`}
                                className="member-action-btn"
                              >
                                Ver
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="member-pagination">
                  <p className="member-pagination-text">
                    A mostrar <span className="member-pagination-strong">{totalAthletes === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}</span> até <span className="member-pagination-strong">{Math.min(page * PAGE_SIZE, totalAthletes)}</span> de <span className="member-pagination-strong">{totalAthletes}</span> atletas
                  </p>
                  <div className="member-pagination-controls">
                    <button
                      className="member-icon-btn"
                      disabled={page === 1}
                      onClick={() => setPage((current) => Math.max(1, current - 1))}
                      type="button"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="member-pagination-current">
                      {page} / {totalPages}
                    </span>
                    <button
                      className="member-icon-btn"
                      disabled={page === totalPages}
                      onClick={() =>
                        setPage((current) => Math.min(totalPages, current + 1))
                      }
                      type="button"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
