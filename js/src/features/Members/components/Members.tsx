import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Bell, ChevronDown, ChevronLeft, ChevronRight, ClipboardCheck, Eye, Pencil, Plus, Search, UserX, Users, ShieldAlert } from "lucide-react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { MEMBERS_PAGE_SIZE, useMembersList } from "../hooks";
import { memberStatusColor } from "../utils";
import { formatDate } from "../../../shared/utils";
import { useAuth } from "../../../shared/hooks/useAuth";

export default function Members() {
  const { t } = useTranslation();
  const { role, activeMemberId } = useAuth();
  const location = useLocation();
  const memberBasePath = location.pathname.startsWith("/admin") ? "/admin/members" : "/members";

  const [pendingOpen, setPendingOpen] = useState(false);
  const {
    categoryFilter,
    errorMessage,
    isLoading,
    members,
    page,
    pendingMembers,
    searchTerm,
    setCategoryFilter,
    setPage,
    setSearchTerm,
    deactivate,
    setStatusFilter,
    statusFilter,
    totalMembers,
    totalPages,
  } =
    useMembersList(role, t);

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
            <Link to={`${memberBasePath}/create`} className="member-primary-link-compact">
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
                          <span className="member-pending-number">{member.memberNumber > 0 ? `#${member.memberNumber}` : t("members.list.pending.withoutNumber")}</span>
                          <span className="member-pagination-strong">{member.completeName}</span>
                        </div>
                        <div className="member-pending-meta">
                          <span>{t("members.list.pending.registeredAt", { date: formatDate(member.registrationDate) })}</span>
                          <span>•</span>
                          <span>{member.city}</span>
                        </div>
                      </div>
                      <Link
                        aria-label={t("members.list.pending.evaluate")}
                        className="member-btn-evaluate"
                        title={t("members.list.pending.evaluate")}
                        to={`${memberBasePath}/${member.memberId}`}
                      >
                        <ClipboardCheck size={16} />
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        <section className="member-table-wrapper">
          <div className="member-list-filters">
            <label className="member-list-search">
              <span className="member-label">{t("members.list.filters.search")}</span>
              <div className="member-list-search-control">
                <Search size={18} />
                <input
                  className="member-list-search-input"
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder={t("members.list.filters.searchPlaceholder")}
                  type="search"
                  value={searchTerm}
                />
              </div>
            </label>

            <label className="member-list-filter">
              <span className="member-label">{t("members.list.filters.category")}</span>
              <select
                className="member-input"
                onChange={(event) => setCategoryFilter(event.target.value as typeof categoryFilter)}
                value={categoryFilter}
              >
                <option value="">{t("members.list.filters.allCategories")}</option>
                <option value="SOCIO">{t("members.labels.categories.SOCIO")}</option>
                <option value="ATLETA_SOCIO">{t("members.labels.categories.ATLETA_SOCIO")}</option>
              </select>
            </label>

            <label className="member-list-filter">
              <span className="member-label">{t("members.list.filters.status")}</span>
              <select
                className="member-input"
                onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
                value={statusFilter}
              >
                <option value="">{t("members.list.filters.allStatuses")}</option>
                <option value="ATIVO">{t("members.labels.statuses.ATIVO")}</option>
                <option value="PENDENTE">{t("members.labels.statuses.PENDENTE")}</option>
                <option value="INATIVO">{t("members.labels.statuses.INATIVO")}</option>
                <option value="REJEITADO">{t("members.labels.statuses.REJEITADO")}</option>
              </select>
            </label>
          </div>

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
                    {members.length === 0 ? (
                      <tr>
                        <td className="member-table-empty" colSpan={6}>{t("members.list.filters.empty")}</td>
                      </tr>
                    ) : (
                      members.map((member) => (
                        <tr className="member-tr-interactive" key={member.memberId}>
                          <td className="member-td-number">{member.memberNumber > 0 ? `#${member.memberNumber}` : t("members.list.pending.withoutNumber")}</td>
                          <td className="member-td">
                            <div className="member-pagination-strong">{member.completeName}</div>
                            <div className="member-cell-email">{member.email}</div>
                          </td>
                          <td className="member-td">
                            <span className="member-category-badge">{t(`members.labels.categories.${member.category}`)}</span>
                          </td>
                          <td className="member-td">
                            <span className={`member-status-badge ${memberStatusColor(member.status)}`}>{t(`members.labels.statuses.${member.status}`)}</span>
                          </td>
                          <td className="member-td">
                            <div className="member-cell-primary">{formatDate(member.registrationDate)}</div>
                            <div className="member-helper-text">{member.city}</div>
                          </td>
                          <td className="member-td-right">
                            <div className="member-row-actions">
                              <Link
                                aria-label={t("members.common.edit")}
                                className="member-btn-table-edit"
                                title={t("members.common.edit")}
                                to={`${memberBasePath}/${member.memberId}/edit`}
                              >
                                <Pencil size={16} />
                              </Link>
                              <Link
                                aria-label={t("members.common.view")}
                                className="member-action-btn"
                                title={t("members.common.view")}
                                to={`${memberBasePath}/${member.memberId}`}
                              >
                                <Eye size={16} />
                              </Link>
                              {member.status !== "INATIVO" ? (
                                <button
                                  aria-label={t("members.common.deactivate")}
                                  className="member-action-danger"
                                  onClick={() => void deactivate(member.memberId)}
                                  title={t("members.common.deactivate")}
                                  type="button"
                                >
                                  <UserX size={16} />
                                </button>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="member-pagination">
                <p className="member-pagination-text">
                  {t("members.pagination.showing")} <span className="member-pagination-strong">{totalMembers === 0 ? 0 : (page - 1) * MEMBERS_PAGE_SIZE + 1}</span>{" "}
                  {t("members.pagination.to")} <span className="member-pagination-strong">{Math.min(page * MEMBERS_PAGE_SIZE, totalMembers)}</span>{" "}
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
