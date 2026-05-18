import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Bell, ChevronDown, ChevronLeft, ChevronRight, Plus, Users, ShieldAlert } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { fetchMembers, type Member } from "..";
import { formatDate } from "../../../shared/utils";
import { useAuth } from "../../../shared/hooks/useAuth";

const PAGE_SIZE = 8;

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

export default function Members() {
  const { t } = useTranslation();
  const { role, activeMemberId } = useAuth();

  const [members, setMembers] = useState<Member[]>([]);
  const [page, setPage] = useState(1);
  const [totalMembers, setTotalMembers] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [pendingOpen, setPendingOpen] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function loadMembers() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const response = await fetchMembers(page, PAGE_SIZE);

        if (!ignore) {
          setMembers(response.items);
          setTotalMembers(response.total);
          setTotalPages(response.totalPages);
        }
      } catch {
        if (!ignore) {
          setErrorMessage(t("members.list.errors.load"));
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
  }, [page, role, t]);

  const pendingMembers = useMemo(() => members.filter((member) => member.status === "PENDENTE"), [members]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  if (role === "NORMAL") {
    if (activeMemberId) {
      return <Navigate to={`/members/${activeMemberId}`} replace />;
    }
    return <Navigate to="/members/create" replace />;
  }

  return (
    <main className="member-page">
      <div className="member-container">
        <header className="member-header-container">
          <div>
            <div className="member-kicker">
              <Users size={18} />
              <span>{t("members.list.kicker")}</span>
            </div>
            <h1 className="member-page-title">{t("members.list.title")}</h1>
            <p className="member-page-desc">{t("members.list.description")}</p>
          </div>

          <div className="member-header-actions">
            <Link to="/members/create" className="member-primary-link-compact">
              <Plus size={18} />
              {t("members.list.newMember")}
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
          <button className="member-pending-toggle" onClick={() => setPendingOpen((current) => !current)} type="button">
            <div className="member-pending-summary">
              <div className="member-pending-icon">
                <Bell size={20} />
              </div>
              <span className="member-pending-title">{t("members.list.pending.title")}</span>
              <span className="member-pending-count">{pendingMembers.length}</span>
            </div>
            <ChevronDown size={20} className={`member-pending-chevron ${pendingOpen ? "member-pending-chevron-open" : ""}`} />
          </button>

          {pendingOpen && (
            <div className="member-pending-panel">
              {pendingMembers.length === 0 ? (
                <p className="member-pending-empty">{t("members.list.pending.empty")}</p>
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
                          <span>{t("members.list.pending.registeredAt", { date: formatDate(member.registrationDate) })}</span>
                          <span>•</span>
                          <span>{member.city}</span>
                        </div>
                      </div>
                      <Link className="member-btn-evaluate" to={`/members/${member.memberId}`}>
                        {t("members.list.pending.evaluate")}
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
              <p className="member-loading-text">{t("members.list.loading")}</p>
            </div>
          ) : !errorMessage && (
            <>
              <div className="member-table-scroll">
                <table className="member-table-wide">
                  <thead className="member-table-head">
                    <tr>
                      <th className="member-th">{t("members.list.table.number")}</th>
                      <th className="member-th">{t("members.fields.name")}</th>
                      <th className="member-th">{t("members.fields.category")}</th>
                      <th className="member-th">{t("members.fields.status")}</th>
                      <th className="member-th">{t("members.list.table.registrationCity")}</th>
                      <th className="member-th-right">{t("members.list.table.actions")}</th>
                    </tr>
                  </thead>
                  <tbody className="member-table-body">
                    {members.map((member) => (
                      <tr className="member-tr-interactive" key={member.memberId}>
                        <td className="member-td-number">#{member.memberNumber}</td>
                        <td className="member-td">
                          <div className="member-pagination-strong">{member.completeName}</div>
                          <div className="member-cell-email">{member.email}</div>
                        </td>
                        <td className="member-td">
                          <span className="member-category-badge">{t(`members.labels.categories.${member.category}`)}</span>
                        </td>
                        <td className="member-td">
                          <span className={`member-status-badge ${statusColor(member.status)}`}>{t(`members.labels.statuses.${member.status}`)}</span>
                        </td>
                        <td className="member-td">
                          <div className="member-cell-primary">{formatDate(member.registrationDate)}</div>
                          <div className="member-helper-text">{member.city}</div>
                        </td>
                        <td className="member-td-right">
                          <div className="member-row-actions">
                            <Link to={`/members/${member.memberId}/edit`} className="member-btn-table-edit">
                              {t("members.common.edit")}
                            </Link>
                            <Link to={`/members/${member.memberId}`} className="member-action-btn">
                              {t("members.common.view")}
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
                  {t("members.pagination.showing")} <span className="member-pagination-strong">{totalMembers === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}</span>{" "}
                  {t("members.pagination.to")} <span className="member-pagination-strong">{Math.min(page * PAGE_SIZE, totalMembers)}</span>{" "}
                  {t("members.pagination.of")} <span className="member-pagination-strong">{totalMembers}</span> {t("members.pagination.items")}
                </p>
                <div className="member-pagination-controls">
                  <button className="member-icon-btn" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))} type="button">
                    <ChevronLeft size={16} />
                  </button>
                  <span className="member-pagination-current">
                    {page} / {totalPages}
                  </span>
                  <button className="member-icon-btn" disabled={page === totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))} type="button">
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
