import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, Navigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, ShieldAlert } from "lucide-react";
import { useAuth } from "../../../shared/hooks/useAuth";
import { formatCurrency } from "../../../shared/utils";
import { useSponsorApprovals } from "../hooks";
import { orderSponsorApprovalItems, sponsorshipStatusClass, sponsorshipStatusLabel, sponsorTypeLabel } from "../utils";

export default function SponsorApprovals() {
  const { t } = useTranslation();
  const { role } = useAuth();
  const canManage = role === "ADMIN" || role === "SECRETARIA";
  const [page, setPage] = useState(1);
  const { errorMessage, isLoading, items, pageSize, runAction, totalItems, totalPages } = useSponsorApprovals(canManage, page);
  const orderedItems = useMemo(() => orderSponsorApprovalItems(items), [items]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  if (!role) {
    return <Navigate to="/auth/login" replace />;
  }

  if (!canManage) {
    return <Navigate to="/sponsors" replace />;
  }

  return (
    <main className="sponsor-page">
      <div className="sponsor-shell">
        <section className="sponsor-page-header">
          <div>
            <p className="sponsor-section-eyebrow">{t("sponsors.approvals.eyebrow")}</p>
            <h1 className="sponsor-panel-title">{t("sponsors.approvals.title")}</h1>
            <p className="sponsor-muted-text">{t("sponsors.approvals.description")}</p>
          </div>
          <Link className="sponsor-button-secondary" to="/sponsors/settings">
            {t("sponsors.approvals.settingsLink")}
          </Link>
        </section>

        {errorMessage ? (
          <div className="sponsor-feedback sponsor-feedback-error">
            <ShieldAlert size={18} />
            <span>{errorMessage}</span>
          </div>
        ) : null}

        <section className="sponsor-panel">
          {isLoading ? (
            <div className="sponsor-empty-card">{t("sponsors.approvals.loading")}</div>
          ) : orderedItems.length === 0 ? (
            <div className="sponsor-empty-card">{t("sponsors.approvals.empty")}</div>
          ) : (
            <div className="sponsor-contract-list">
              {orderedItems.map(({ sponsor, sponsorship }) => (
                <article className="sponsor-contract-card" key={sponsorship.sponsorshipId}>
                  <div className="sponsor-contract-main">
                    <div>
                      <div className="sponsor-contract-topline">
                        <strong>{sponsor.name}</strong>
                        <span className={sponsorshipStatusClass(sponsorship.status)}>
                          {sponsorshipStatusLabel(sponsorship.status, t)}
                        </span>
                      </div>
                      <p className="sponsor-contract-target">
                        {sponsorTypeLabel(sponsorship.type, t)} · {formatCurrency(sponsorship.price)}
                      </p>
                      <p className="sponsor-contract-meta">
                        {t("sponsors.fields.nif")} {sponsor.nif} · {sponsor.email} · {sponsor.phone} ·{" "}
                        {t("sponsors.fields.season")} {sponsorship.season}
                      </p>
                    </div>
                    <div className="sponsor-contract-actions">
                      {sponsorship.status === "SUBMETIDO" ? (
                        <button className="sponsor-button-primary" onClick={() => void runAction(sponsorship.sponsorshipId, "approve")} type="button">
                          {t("sponsors.approvals.actions.approve")}
                        </button>
                      ) : null}
                      {sponsorship.status === "APROVADO" ? (
                        <button className="sponsor-button-secondary" onClick={() => void runAction(sponsorship.sponsorshipId, "paid")} type="button">
                          {t("sponsors.approvals.actions.markPaid")}
                        </button>
                      ) : null}
                      {sponsorship.status !== "CANCELADO" && sponsorship.status !== "PAGO" ? (
                        <button className="sponsor-button-ghost" onClick={() => void runAction(sponsorship.sponsorshipId, "cancel")} type="button">
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
