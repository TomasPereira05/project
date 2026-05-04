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
      return "bg-green-100 text-green-800 border-green-200";
    case "PENDENTE":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "INATIVO":
      return "bg-gray-100 text-gray-800 border-gray-200";
    case "REJEITADO":
      return "bg-red-100 text-red-800 border-red-200";
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
            <div className="flex items-center gap-2 text-primary font-semibold tracking-wider text-sm mb-1 uppercase">
              <Users size={18} />
              <span>Administração</span>
            </div>
            <h1 className="member-page-title">Lista de Sócios</h1>
            <p className="member-page-desc max-w-2xl">
              Gerencie os sócios do clube. Aprove ou rejeite pedidos pendentes e consulte o estado de cada membro.
            </p>
          </div>

          <div className="flex gap-3">
            <Link 
              to="/members/create" 
              className="member-btn-primary shadow-sm h-10 px-5"
            >
              <Plus size={18} />
              Novo Sócio
            </Link>
          </div>
        </header>

        {/* ALERTS */}
        {errorMessage && (
            <div className="member-alert-error">
                <ShieldAlert size={20} className="text-red-500" />
                <p className="text-sm font-medium">{errorMessage}</p>
            </div>
        )}

        {/* PENDING AREA */}
        <section className="mb-8 bg-white border border-border shadow-sm rounded-lg overflow-hidden">
            <button
                className="w-full flex items-center justify-between p-5 hover:bg-muted/50 transition-colors focus:outline-none"
                onClick={() => setPendingOpen((current) => !current)}
                type="button"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-100 text-yellow-700 rounded-full">
                        <Bell size={20} />
                    </div>
                    <span className="font-semibold text-text-primary text-lg">Pedidos Pendentes</span>
                    <span className="bg-yellow-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        {pendingMembers.length}
                    </span>
                </div>
                <ChevronDown size={20} className={`text-text-secondary transition-transform duration-300 ${pendingOpen ? 'rotate-180' : ''}`} />
            </button>

            {pendingOpen && (
                <div className="border-t border-border bg-gray-50/50 p-5">
                    {pendingMembers.length === 0 ? (
                        <p className="text-text-secondary text-sm italic">Sem pedidos pendentes neste momento.</p>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {pendingMembers.map((member) => (
                                <div className="bg-white border border-border p-4 rounded-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm" key={member.memberId}>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-primary">#{member.memberNumber}</span>
                                            <span className="font-semibold text-text-primary">{member.completeName}</span>
                                        </div>
                                        <div className="text-xs text-text-secondary flex items-center gap-2">
                                            <span>Registo em {formatDate(member.registrationDate)}</span>
                                            <span>•</span>
                                            <span>{member.city}</span>
                                        </div>
                                    </div>
                                    <Link
                                        className="inline-flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wide h-8 px-4 border border-primary text-primary hover:bg-primary hover:text-white transition-colors rounded-md"
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
            <div className="member-loading-container py-10">
                <div className="member-loading-spinner"></div>
                <p className="member-loading-text">A carregar sócios...</p>
            </div>
          ) : !errorMessage && (
            <>
              <div className="overflow-x-auto">
                  <table className="member-table min-w-[800px]">
                      <thead className="bg-muted text-text-secondary uppercase text-xs font-semibold tracking-wider border-b border-border">
                          <tr>
                              <th className="member-th">Nº</th>
                              <th className="member-th">Nome</th>
                              <th className="member-th">Categoria</th>
                              <th className="member-th">Estado</th>
                              <th className="member-th">Registo / Cidade</th>
                              <th className="member-th text-right">Ações</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                          {paginatedMembers.map((member) => (
                              <tr className="member-tr group" key={member.memberId}>
                                  <td className="member-td font-bold text-primary">#{member.memberNumber}</td>
                                  <td className="member-td">
                                      <div className="font-semibold text-text-primary">{member.completeName}</div>
                                      <div className="text-xs text-text-secondary truncate max-w-[200px]">{member.email}</div>
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
                                      <div className="text-text-primary">{formatDate(member.registrationDate)}</div>
                                      <div className="text-xs text-text-secondary">{member.city}</div>
                                  </td>
                                  <td className="member-td text-right">
                                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <Link
                                              to={`/members/${member.memberId}/edit`}
                                              className="text-xs font-medium text-text-secondary hover:text-primary transition-colors px-2 py-1"
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
              <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-gray-50/50">
                <p className="text-sm text-text-secondary">
                  A mostrar <span className="font-semibold text-text-primary">{(page - 1) * PAGE_SIZE + 1}</span> até <span className="font-semibold text-text-primary">{Math.min(page * PAGE_SIZE, members.length)}</span> de <span className="font-semibold text-text-primary">{members.length}</span> sócios
                </p>
                <div className="flex items-center gap-2">
                  <button
                    className="inline-flex items-center justify-center p-2 rounded-md border border-border bg-white text-text-secondary hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    disabled={page === 1}
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    type="button"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-sm font-medium text-text-primary px-2">
                    {page} / {totalPages}
                  </span>
                  <button
                    className="inline-flex items-center justify-center p-2 rounded-md border border-border bg-white text-text-secondary hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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

