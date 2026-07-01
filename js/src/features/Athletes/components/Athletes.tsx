import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Bell,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Eye,
  Filter,
  Pencil,
  Plus,
  Search,
  ShieldAlert,
  UserX,
  Users,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import type { AthleteStatus } from "..";
import { ATHLETE_STATUS_OPTIONS, ATHLETES_PAGE_SIZE, useAthletesList } from "../hooks";
import { formatDate } from "../../../shared/utils";
import AthletePageBackground from "./AthletePageBackground";

function statusLabel(status: AthleteStatus, t: (key: string) => string): string {
  switch (status) {
    case "ATIVO":
      return t("athletes.labels.statuses.ATIVO");
    case "PENDENTE":
      return t("athletes.labels.statuses.PENDENTE");
    case "INATIVO":
      return t("athletes.labels.statuses.INATIVO");
    case "REJEITADO":
      return t("athletes.labels.statuses.REJEITADO");
  }
}

function statusColor(status: AthleteStatus): string {
  switch (status) {
    case "ATIVO":
      return "athlete-status-active";
    case "PENDENTE":
      return "athlete-status-pending";
    case "INATIVO":
      return "athlete-status-inactive";
    case "REJEITADO":
      return "athlete-status-rejected";
  }
}

export default function Athletes() {
  const { t } = useTranslation();
  const location = useLocation();
  const athleteBasePath = location.pathname.startsWith("/admin") ? "/admin/athletes" : "/athletes";
  const [pendingOpen, setPendingOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  const {
    athletes,
    errorMessage,
    isLoading,
    page,
    pendingAthletes,
    setPage,
    totalAthletes,
    totalPages,
    searchTerm,
    setSearchTerm,
    selectedStatuses,
    toggleStatus,
    selectedTeamCategoryIds,
    toggleTeamCategory,
    teamCategories,
    clearFilters,
    deactivate,
    activeFilterCount,
  } = useAthletesList(t);

  // Fecha o painel de filtros ao clicar fora.
  useEffect(() => {
    if (!filtersOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setFiltersOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [filtersOpen]);

  return (
    <>
      <main className="athlete-page">
        <AthletePageBackground />
        <div className="athlete-container relative z-20">
          <header className="athlete-header-container">
            <div>
              <div className="athlete-kicker">
                <Users size={18} />
                <span>{t("athletes.list.kicker")}</span>
              </div>
              <h1 className="athlete-page-title">{t("athletes.list.title")}</h1>
              <p className="athlete-page-desc">
                {t("athletes.list.description")}
              </p>
            </div>
            <div className="athlete-header-actions">
              <Link to={`${athleteBasePath}/register`} className="athlete-primary-link-compact">
                <Plus size={18} />
                {t("athletes.list.newRegistration")}
              </Link>
            </div>
          </header>

          {errorMessage && (
            <div className="athlete-alert-error">
              <ShieldAlert size={20} className="athlete-alert-icon-error" />
              <p className="athlete-alert-text">{errorMessage}</p>
            </div>
          )}

          <section className="athlete-pending-card">
            <button
              className="athlete-pending-toggle"
              onClick={() => setPendingOpen((current) => !current)}
              type="button"
            >
              <div className="athlete-pending-summary">
                <div className="athlete-pending-icon">
                  <Bell size={20} />
                </div>
                <span className="athlete-pending-title">{t("athletes.list.pending.title")}</span>
                <span className="athlete-pending-count">{pendingAthletes.length}</span>
              </div>
              <ChevronDown
                size={20}
                className={`athlete-pending-chevron ${pendingOpen ? "athlete-pending-chevron-open" : ""}`}
              />
            </button>

            {pendingOpen && (
              <div className="athlete-pending-panel">
                {pendingAthletes.length === 0 ? (
                  <p className="athlete-pending-empty">{t("athletes.list.pending.empty")}</p>
                ) : (
                  <div className="athlete-pending-list">
                    {pendingAthletes.map((athlete) => (
                      <div className="athlete-pending-item" key={athlete.athleteId}>
                        <div>
                          <div className="athlete-pending-item-head">
                            <span className="athlete-pending-number">#{athlete.member.memberNumber}</span>
                            <span className="athlete-pagination-strong">{athlete.member.completeName}</span>
                          </div>
                          <div className="athlete-pending-meta">
                            <span>{t("athletes.list.pending.registeredAt", { date: formatDate(athlete.member.registrationDate) })}</span>
                            <span>•</span>
                            <span>{athlete.teamCategoryLabel}</span>
                          </div>
                        </div>
                        <Link
                          aria-label={t("athletes.list.pending.evaluate")}
                          className="athlete-btn-evaluate"
                          title={t("athletes.list.pending.evaluate")}
                          to={`${athleteBasePath}/${athlete.athleteId}`}
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

          <section className="athlete-table-wrapper">
            <div className="athlete-list-filters">
              <label className="athlete-list-search">
                <span className="athlete-filter-label">{t("athletes.list.filters.search")}</span>
                <div className="athlete-list-search-control">
                  <Search size={18} />
                  <input
                    className="athlete-list-search-input"
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder={t("athletes.list.filters.searchPlaceholder")}
                    type="search"
                    value={searchTerm}
                  />
                </div>
              </label>

              <div className="athlete-filter-col" ref={filterRef}>
                <div className="athlete-filter-dropdown">
                  <button
                    className="athlete-filter-toggle"
                    onClick={() => setFiltersOpen((current) => !current)}
                    type="button"
                  >
                    <span className="athlete-filter-toggle-label">
                      <Filter size={16} />
                      {t("athletes.list.filters.button")}
                      {activeFilterCount > 0 && (
                        <span className="athlete-filter-badge">{activeFilterCount}</span>
                      )}
                    </span>
                    <ChevronDown
                      size={16}
                      className={`athlete-filter-chevron ${filtersOpen ? "athlete-filter-chevron-open" : ""}`}
                    />
                  </button>

                  {filtersOpen && (
                    <div className="athlete-filter-panel">
                      <div className="athlete-filter-section">
                        <p className="athlete-filter-section-title">{t("athletes.fields.status")}</p>
                        {ATHLETE_STATUS_OPTIONS.map((status) => (
                          <label className="athlete-filter-option" key={status}>
                            <input
                              className="athlete-filter-checkbox"
                              type="checkbox"
                              checked={selectedStatuses.includes(status)}
                              onChange={() => toggleStatus(status)}
                            />
                            <span>{statusLabel(status, t)}</span>
                          </label>
                        ))}
                      </div>

                      <div className="athlete-filter-divider" />

                      <div className="athlete-filter-section">
                        <p className="athlete-filter-section-title">{t("athletes.fields.category")}</p>
                        {teamCategories.length === 0 ? (
                          <p className="athlete-filter-empty">{t("athletes.list.filters.noCategories")}</p>
                        ) : (
                          teamCategories.map((category) => (
                            <label className="athlete-filter-option" key={category.teamId}>
                              <input
                                className="athlete-filter-checkbox"
                                type="checkbox"
                                checked={selectedTeamCategoryIds.includes(category.teamId)}
                                onChange={() => toggleTeamCategory(category.teamId)}
                              />
                              <span>{category.label}</span>
                            </label>
                          ))
                        )}
                      </div>

                      {activeFilterCount > 0 && (
                        <button className="athlete-filter-clear" onClick={clearFilters} type="button">
                          {t("athletes.list.filters.clear")}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="athlete-table-loading">
                <div className="athlete-loading-spinner"></div>
                <p className="athlete-loading-text">{t("athletes.common.loadingAthletes")}</p>
              </div>
            ) : !errorMessage && (
              <>
                <div className="athlete-table-scroll">
                  <table className="athlete-table-wide">
                    <thead className="athlete-table-head">
                      <tr>
                        <th className="athlete-th">{t("athletes.table.memberNumber")}</th>
                        <th className="athlete-th">{t("athletes.fields.name")}</th>
                        <th className="athlete-th">{t("athletes.fields.category")}</th>
                        <th className="athlete-th">{t("athletes.fields.status")}</th>
                        <th className="athlete-th">{t("athletes.table.registrationCity")}</th>
                        <th className="athlete-th-right">{t("athletes.table.actions")}</th>
                      </tr>
                    </thead>
                    <tbody className="athlete-table-body">
                      {athletes.length === 0 ? (
                        <tr>
                          <td className="athlete-table-empty" colSpan={6}>{t("athletes.list.filters.empty")}</td>
                        </tr>
                      ) : (
                        athletes.map((athlete) => (
                          <tr className="athlete-tr-interactive" key={athlete.athleteId}>
                            <td className="athlete-td-number">#{athlete.member.memberNumber}</td>
                            <td className="athlete-td">
                              <div className="athlete-pagination-strong">{athlete.member.completeName}</div>
                              <div className="athlete-cell-email">{athlete.member.email}</div>
                            </td>
                            <td className="athlete-td">
                              <span className="athlete-category-badge">{athlete.teamCategoryLabel}</span>
                            </td>
                            <td className="athlete-td">
                              <span className={`athlete-status-badge ${statusColor(athlete.status)}`}>
                                {statusLabel(athlete.status, t)}
                              </span>
                            </td>
                            <td className="athlete-td">
                              <div className="athlete-cell-primary">{formatDate(athlete.member.registrationDate)}</div>
                              <div className="athlete-helper-text">{athlete.member.city}</div>
                            </td>
                            <td className="athlete-td-right">
                              <div className="athlete-row-actions">
                                <Link
                                  aria-label={t("athletes.common.edit")}
                                  className="athlete-btn-table-edit"
                                  title={t("athletes.common.edit")}
                                  to={`${athleteBasePath}/${athlete.athleteId}`}
                                >
                                  <Pencil size={16} />
                                </Link>
                                <Link
                                  aria-label={t("athletes.common.view")}
                                  className="athlete-action-btn"
                                  title={t("athletes.common.view")}
                                  to={`${athleteBasePath}/${athlete.athleteId}`}
                                >
                                  <Eye size={16} />
                                </Link>
                                {athlete.status !== "INATIVO" ? (
                                  <button
                                    aria-label={t("athletes.detail.actions.deactivate")}
                                    className="athlete-action-danger"
                                    onClick={() => void deactivate(athlete.athleteId)}
                                    title={t("athletes.detail.actions.deactivate")}
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

                <div className="athlete-pagination">
                  <p className="athlete-pagination-text">
                    {t("athletes.pagination.showing")} <span className="athlete-pagination-strong">{totalAthletes === 0 ? 0 : (page - 1) * ATHLETES_PAGE_SIZE + 1}</span> {t("athletes.pagination.to")} <span className="athlete-pagination-strong">{Math.min(page * ATHLETES_PAGE_SIZE, totalAthletes)}</span> {t("athletes.pagination.of")} <span className="athlete-pagination-strong">{totalAthletes}</span> {t("athletes.pagination.items")}
                  </p>
                  <div className="athlete-pagination-controls">
                    <button
                      className="athlete-icon-btn"
                      disabled={page === 1}
                      onClick={() => setPage((current) => Math.max(1, current - 1))}
                      type="button"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="athlete-pagination-current">
                      {page} / {totalPages}
                    </span>
                    <button
                      className="athlete-icon-btn"
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
