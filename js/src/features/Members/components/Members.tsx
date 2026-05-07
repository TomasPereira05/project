import { useEffect, useMemo, useState } from "react";
import { Bell, ChevronDown, ChevronLeft, ChevronRight, Plus, Users, ShieldAlert} from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import {
  fetchMembers,
  type Member,
} from "..";
import { formatDate } from "../../../shared/utils";
import { useAuth } from "../../../shared/hooks/useAuth";

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

function statusColor(status: Member["status"]) {
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

function categoryLabel(category: Member["category"]) {
  return category === "ATLETA_SOCIO" ? "Atleta Sócio" : "Sócio";
}

export default function Members() {
  const { role, activeMemberId } = useAuth();
  
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
          setErrorMessage("Não foi possível carregar a lista de sócios.");
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    if (role === "ADMIN" || role === "SECRETARIA") {
        loadMembers();
    }

    return () => {
      ignore = true;
    };
  }, [role]);

  // RBAC logic
  if (role === "NORMAL") {
    if (activeMemberId) {
      return <Navigate to={`/members/${activeMemberId}`} replace />;
    } else {
      return <Navigate to="/members/create" replace />;
    }
  }

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


  return (
    <>
      <main className="member-page">
      <div className="member-container">
        
        {/* TOPBAR */}
        <header className="member-header-container">
          <div>
            <div className="member-kicker">
              <Users size={18} />
              <span>Administração</span>
            </div>
            <h1 className="member-page-title">Lista de Sócios</h1>
            <p className="member-page-desc">
              Gerencie os sócios do clube. Aprove ou rejeite pedidos pendentes e consulte o estado de cada membro.
            </p>
          </div>

          <div className="member-header-actions">
            <Link 
              to="/members/create" 
              className="member-primary-link-compact"
            >
              <Plus size={18} />
              Novo Sócio
            </Link>
          </div>
        </header>

        {/* ALERTS */}
        {errorMessage && (
            <div className="member-alert-error">
                <ShieldAlert size={20} className="member-alert-icon-error" />
                <p className="member-alert-text">{errorMessage}</p>
            </div>
        )}

        {/* PENDING AREA */}
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
                    <span className="member-pending-title">Pedidos Pendentes</span>
                    <span className="member-pending-count">
                        {pendingMembers.length}
                    </span>
                </div>
                <ChevronDown size={20} className={`member-pending-chevron ${pendingOpen ? "member-pending-chevron-open" : ""}`} />
            </button>

            {pendingOpen && (
                <div className="member-pending-panel">
                    {pendingMembers.length === 0 ? (
                        <p className="member-pending-empty">Sem pedidos pendentes neste momento.</p>
                    ) : (
                        <div className="member-pending-list">
                            {pendingMembers.map((member) => (
                                <div className="member-pending-item" key={member.memberId}>
                                    <div>
                                        <div className="member-pending-item-head">
                                            <span className="member-pending-number">#{member.memberNumber}</span>
                                            <span className="member-pagination-strong">{member.completeName}</span>
                                        </div>
                                        <div className="member-pending-meta">
                                            <span>Registo em {formatDate(member.registrationDate)}</span>
                                            <span>•</span>
                                            <span>{member.city}</span>
                                        </div>
                                    </div>
                                    <Link
                                        className="member-btn-evaluate"
                                        to={`/members/${member.memberId}`}
                                    >
                                        Avaliar Pedido
                                    </Link>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </section>


        {/* LIST */}
        <section className="member-table-wrapper">
          {isLoading ? (
            <div className="member-table-loading">
                <div className="member-loading-spinner"></div>
                <p className="member-loading-text">A carregar sócios...</p>
            </div>
          ) : !errorMessage && (
            <>
              <div className="member-table-scroll">
                  <table className="member-table-wide">
                      <thead className="member-table-head">
                          <tr>
                              <th className="member-th">Nº</th>
                              <th className="member-th">Nome</th>
                              <th className="member-th">Categoria</th>
                              <th className="member-th">Estado</th>
                              <th className="member-th">Registo / Cidade</th>
                              <th className="member-th-right">Ações</th>
                          </tr>
                      </thead>
                      <tbody className="member-table-body">
                          {paginatedMembers.map((member) => (
                              <tr className="member-tr-interactive" key={member.memberId}>
                                  <td className="member-td-number">#{member.memberNumber}</td>
                                  <td className="member-td">
                                      <div className="member-pagination-strong">{member.completeName}</div>
                                      <div className="member-cell-email">{member.email}</div>
                                  </td>
                                  <td className="member-td">
                                      <span className="member-category-badge">
                                          {categoryLabel(member.category)}
                                      </span>
                                  </td>
                                  <td className="member-td">
                                      <span className={`member-status-badge ${statusColor(member.status)}`}>
                                          {statusLabel(member.status)}
                                      </span>
                                  </td>
                                  <td className="member-td">
                                      <div className="member-cell-primary">{formatDate(member.registrationDate)}</div>
                                      <div className="member-helper-text">{member.city}</div>
                                  </td>
                                  <td className="member-td-right">
                                      <div className="member-row-actions">
                                          <Link
                                              to={`/members/${member.memberId}/edit`}
                                              className="member-btn-table-edit"
                                          >
                                              Editar
                                          </Link>
                                          <Link
                                              to={`/members/${member.memberId}`}
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

              {/* PAGINATION */}
              <div className="member-pagination">
                <p className="member-pagination-text">
                  A mostrar <span className="member-pagination-strong">{(page - 1) * PAGE_SIZE + 1}</span> até <span className="member-pagination-strong">{Math.min(page * PAGE_SIZE, members.length)}</span> de <span className="member-pagination-strong">{members.length}</span> sócios
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
    </>
  );
}


