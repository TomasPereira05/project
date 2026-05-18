import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatCurrency } from "../../../shared/utils";
import { useMySponsorships } from "../hooks";
import {
  calculateMySponsorshipTotals,
  resolveSponsorshipTarget,
  sponsorshipStatusClass,
  sponsorshipStatusLabel,
  sponsorTypeLabel,
} from "../utils";

export default function MySponsorships() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const { catalogs, errorMessage, isLoading, items, pageSize, totalItems, totalPages } = useMySponsorships(page);
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
            <p className="sponsor-section-eyebrow">{t("sponsors.my.eyebrow")}</p>
            <h1 className="sponsor-panel-title">{t("sponsors.my.title")}</h1>
            <p className="sponsor-muted-text">{t("sponsors.my.description")}</p>
          </div>
          <Link className="sponsor-button-secondary" to="/sponsors/info">
            {t("sponsors.my.viewOptions")}
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
              <p className="sponsor-section-eyebrow">{t("sponsors.my.contractsEyebrow")}</p>
              <h2 className="sponsor-panel-title">{t("sponsors.my.listTitle")}</h2>
            </div>
          </div>

          {isLoading ? (
            <div className="sponsor-empty-card">{t("sponsors.my.loading")}</div>
          ) : items.length === 0 ? (
            <div className="sponsor-empty-card">{t("sponsors.my.empty")}</div>
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
                        {sponsorTypeLabel(sponsorship.type, t)} · {t("sponsors.fields.season")} {sponsorship.season}
                        {sponsor ? ` · ${sponsor.name}` : ""}
                      </p>
                    </div>
                    <div className="sponsor-contract-actions">
                      <Link className="sponsor-button-secondary" to={`/sponsors/my/${sponsorship.sponsorshipId}`}>
                        {t("sponsors.my.details")}
                      </Link>
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
