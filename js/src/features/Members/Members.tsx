import { useEffect, useMemo, useState } from "react";
import { Bell, ChevronDown, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./Members.css";
import {
  fetchMembers,
  formatDate,
  getViewerMode,
  type Member,
  type ViewerMode,
} from "../../shared/api/members";

const PAGE_SIZE = 8;

function statusLabel(status: Member["status"]) {
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

function categoryLabel(category: Member["category"]) {
  return category === "ATLETA_SOCIO" ? "Atleta socio" : "Socio";
}

export default function Members() {
  const location = useLocation();
  const navigate = useNavigate();
  const viewer = getViewerMode(location.search);
  const [members, setMembers] = useState<Member[]>([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [pendingOpen, setPendingOpen] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function loadMembers() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const response = await fetchMembers();

        if (!ignore) {
          const sorted = [...response].sort(
            (first, second) => first.memberNumber - second.memberNumber,
          );
          setMembers(sorted);
        }
      } catch {
        if (!ignore) {
          setErrorMessage("Nao foi possivel carregar a lista de socios.");
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadMembers();

    return () => {
      ignore = true;
    };
  }, []);

  const pendingMembers = useMemo(
    () => members.filter((member) => member.status === "PENDENTE"),
    [members],
  );

  const totalPages = Math.max(1, Math.ceil(members.length / PAGE_SIZE));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const paginatedMembers = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return members.slice(start, start + PAGE_SIZE);
  }, [members, page]);

  function changeViewer(nextViewer: ViewerMode) {
    navigate(`/members?viewer=${nextViewer}`);
  }

  return (
    <main className="members-page">
      <div className="members-shell">
        <header className="members-topbar">
          <div className="members-brand">
            <p>Jagoz</p>
            <h1>Lista de socios</h1>
            <p>
              Ordenada pelo numero de socio e preparada para administracao,
              consulta publica e navegacao do proprio socio.
            </p>
          </div>

          <div className="members-actions">
            <Link className="secondary-button" to="/">
              Home
            </Link>
            <Link className="primary-button" to="/members/create">
              <Plus size={18} />
              Novo socio
            </Link>
          </div>
        </header>

        <section className="page-panel">
          <div className="member-toolbar">
            <div>
              <h2>Vista da pagina</h2>
              <p>
                Como ainda nao existe contexto de autenticacao no frontend, esta
                troca permite validar os diferentes papeis.
              </p>
            </div>

            <div className="members-viewer">
              <span>Ver como:</span>
              {(["admin", "self", "public"] as ViewerMode[]).map((mode) => (
                <button
                  key={mode}
                  className={viewer === mode ? "is-active" : "ghost-button"}
                  onClick={() => changeViewer(mode)}
                  type="button"
                >
                  {mode === "admin"
                    ? "Admin"
                    : mode === "self"
                      ? "O proprio socio"
                      : "Utilizador normal"}
                </button>
              ))}
            </div>
          </div>

          {viewer === "admin" ? (
            <div className="pending-area">
              <button
                className="pending-toggle"
                onClick={() => setPendingOpen((current) => !current)}
                type="button"
              >
                <Bell size={18} />
                Pedidos pendentes
                <span className="pending-count">{pendingMembers.length}</span>
                <ChevronDown size={18} />
              </button>

              {pendingOpen ? (
                <div className="pending-dropdown">
                  <div className="pending-list">
                    {pendingMembers.length === 0 ? (
                      <p>Sem pedidos pendentes neste momento.</p>
                    ) : (
                      pendingMembers.map((member) => (
                        <div className="pending-item" key={member.memberId}>
                          <div className="pending-item-meta">
                            <strong>
                              #{member.memberNumber} {member.completeName}
                            </strong>
                            <span>Registo em {formatDate(member.registrationDate)}</span>
                          </div>

                          <Link
                            className="secondary-button"
                            to={`/members/${member.memberId}?viewer=admin`}
                          >
                            Abrir ficha
                          </Link>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {errorMessage ? (
            <div className="feedback-message is-error">{errorMessage}</div>
          ) : null}

          {isLoading ? <p>A carregar socios...</p> : null}

          {!isLoading && !errorMessage ? (
            <>
              <div className="members-list">
                {paginatedMembers.map((member) => (
                  <article className="members-list-item" key={member.memberId}>
                    <div className="members-list-item-header">
                      <div>
                        <h3>
                          #{member.memberNumber} {member.completeName}
                        </h3>
                        <p>
                          Registado em {formatDate(member.registrationDate)} -{" "}
                          {member.city}
                        </p>
                      </div>

                      <div className="member-badges">
                        <span
                          className="member-status-chip"
                          data-status={member.status}
                        >
                          {statusLabel(member.status)}
                        </span>
                        <span className="member-chip">
                          {categoryLabel(member.category)}
                        </span>
                        <span className="member-chip">{member.email}</span>
                      </div>
                    </div>

                    <div className="member-toolbar">
                      <p>
                        Numero de socio #{member.memberNumber} com dados prontos
                        para consulta e eventual atualizacao.
                      </p>

                      <div className="members-actions">
                        <Link
                          className="secondary-button"
                          to={`/members/${member.memberId}?viewer=${viewer}`}
                        >
                          Ver ficha
                        </Link>
                        <Link
                          className="ghost-button"
                          to={`/members/${member.memberId}/edit`}
                        >
                          Atualizar
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              <div className="members-pagination">
                <button
                  className="ghost-button"
                  disabled={page === 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  type="button"
                >
                  <ChevronLeft size={18} />
                  Anterior
                </button>
                <button className="secondary-button" type="button">
                  Pagina {page} de {totalPages}
                </button>
                <button
                  className="ghost-button"
                  disabled={page === totalPages}
                  onClick={() =>
                    setPage((current) => Math.min(totalPages, current + 1))
                  }
                  type="button"
                >
                  Seguinte
                  <ChevronRight size={18} />
                </button>
              </div>
            </>
          ) : null}
        </section>
      </div>
    </main>
  );
}
