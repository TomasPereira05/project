import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Ban, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { formatCurrency } from "../../../shared/utils";
import { useAdminSponsorships } from "../hooks";
import type { SponsorshipStatus } from "../types";
import {
  calculateMySponsorshipTotals,
  resolveSponsorshipTarget,
  sponsorshipStatusClass,
  sponsorshipStatusLabel,
  sponsorTypeLabel,
} from "../utils";

export default function AdminSponsorships() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<SponsorshipStatus | "">("");
  const { cancel, catalogs, errorMessage, isLoading, items, markPaid, pageSize, totalItems, totalPages } = useAdminSponsorships(page, statusFilter);
  const totals = useMemo(() => calculateMySponsorshipTotals(items), [items]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  return (
    <main className="sponsor-page">
      <div className="sponsor-shell">
        <section className="sponsor-page-header">
          <div>
            <p className="sponsor-section-eyebrow">{t("sponsors.admin.eyebrow")}</p>
            <h1 className="sponsor-panel-title">{t("sponsors.admin.title")}</h1>
            <p className="sponsor-muted-text">{t("sponsors.admin.description")}</p>
          </div>
          <Link className="sponsor-button-secondary" to="/admin/sponsors/approvals">
            {t("sponsors.admin.approvalsLink")}
          </Link>
        </section>

        {errorMessage ? <div className="sponsor-feedback sponsor-feedback-error">{errorMessage}</div> : null}

        <section className="sponsor-stat-grid">
          <div className="sponsor-stat-card">
            <span className="sponsor-stat-label">{t("sponsors.my.stats.total")}</span>
            <strong className="sponsor-stat-value">{totalItems}</strong>
          </div>
          <div className="sponsor-stat-card">
            <span className="sponsor-stat-label">{t("sponsors.my.stats.submitted")}</span>
            <strong className="sponsor-stat-value">{totals.pending}</strong>
          </div>
          <div className="sponsor-stat-card">
            <span className="sponsor-stat-label">{t("sponsors.my.stats.activeValue")}</span>
            <strong className="sponsor-stat-value">{formatCurrency(totals.value)}</strong>
          </div>
        </section>

        <section className="sponsor-panel">
          <div className="sponsor-panel-header">
            <div>
              <p className="sponsor-section-eyebrow">{t("sponsors.admin.contractsEyebrow")}</p>
              <h2 className="sponsor-panel-title">{t("sponsors.admin.listTitle")}</h2>
            </div>
          </div>

          <div className="sponsor-admin-filters">
            <label className="sponsor-admin-filter">
              <span>{t("sponsors.admin.filters.status")}</span>
              <select
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value as SponsorshipStatus | "");
                  setPage(1);
                }}
              >
                <option value="">{t("sponsors.admin.filters.allStatuses")}</option>
                <option value="SUBMETIDO">{t("sponsors.labels.statuses.SUBMETIDO")}</option>
                <option value="APROVADO">{t("sponsors.labels.statuses.APROVADO")}</option>
                <option value="PAGO">{t("sponsors.labels.statuses.PAGO")}</option>
                <option value="ATIVO">{t("sponsors.labels.statuses.ATIVO")}</option>
                <option value="CANCELADO">{t("sponsors.labels.statuses.CANCELADO")}</option>
              </select>
            </label>
          </div>

          {isLoading ? (
            <div className="sponsor-empty-card">{t("sponsors.admin.loading")}</div>
          ) : items.length === 0 ? (
            <div className="sponsor-empty-card">{t("sponsors.admin.empty")}</div>
          ) : (
            <div className="sponsor-contract-list">
              {items.map(({ sponsor, sponsorship }) => (
                <article className="sponsor-contract-card" key={sponsorship.sponsorshipId}>
                  <div className="sponsor-contract-main">
                    <div>
                      <div className="sponsor-contract-topline">
                        <span className={sponsorshipStatusClass(sponsorship.status)}>
                          {sponsorshipStatusLabel(sponsorship.status, t)}
                        </span>
                        <span className="sponsor-price-pill">{formatCurrency(sponsorship.price)}</span>
                      </div>
                      <h3 className="sponsor-contract-target">{resolveSponsorshipTarget(sponsorship, catalogs, t)}</h3>
                      <p className="sponsor-contract-meta">
                        {sponsorTypeLabel(sponsorship.type, t)} - {t("sponsors.fields.season")} {sponsorship.season}
                        {sponsor ? ` - ${sponsor.name}` : ""}
                      </p>
                    </div>
                    <div className="sponsor-contract-actions">
                      <Link className="sponsor-button-secondary" state={{ backPath: "/admin/sponsors" }} to={`/admin/sponsors/details/${sponsorship.sponsorshipId}`}>
                        {t("sponsors.my.details")}
                      </Link>
                      {sponsorship.status === "APROVADO" ? (
                        <button className="sponsor-button-primary" onClick={() => void markPaid(sponsorship.sponsorshipId)} type="button">
                          <CheckCircle2 size={16} />
                          {t("sponsors.approvals.actions.markPaid")}
                        </button>
                      ) : null}
                      {sponsorship.status !== "CANCELADO" && sponsorship.status !== "PAGO" ? (
                        <button className="sponsor-button-ghost" onClick={() => void cancel(sponsorship.sponsorshipId)} type="button">
                          <Ban size={16} />
                          {t("sponsors.approvals.actions.cancel")}
                        </button>
                      ) : null}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <div className="member-pagination">
          <p className="member-pagination-text">
            {t("sponsors.pagination.showing")}{" "}
            <span className="member-pagination-strong">{totalItems === 0 ? 0 : (page - 1) * pageSize + 1}</span>{" "}
            {t("sponsors.pagination.to")}{" "}
            <span className="member-pagination-strong">{Math.min(page * pageSize, totalItems)}</span>{" "}
            {t("sponsors.pagination.of")} <span className="member-pagination-strong">{totalItems}</span>{" "}
            {t("sponsors.pagination.items")}
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
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              type="button"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
