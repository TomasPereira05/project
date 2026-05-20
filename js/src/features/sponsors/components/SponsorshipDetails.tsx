import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import { formatCurrency } from "../../../shared/utils";
import { useSponsorshipDetails } from "../hooks";
import {
  resolveSponsorshipTarget,
  sponsorshipStatusClass,
  sponsorshipStatusLabel,
  sponsorTypeLabel,
} from "../utils";

export default function SponsorshipDetails() {
  const { t } = useTranslation();
  const { sponsorshipId } = useParams();
  const { catalogs, errorMessage, handlePay, isLoading, isPaying, sponsor, sponsorship } = useSponsorshipDetails(sponsorshipId);
  const canPay = sponsorship?.status === "APROVADO";

  return (
    <main className="sponsor-page">
      <div className="sponsor-shell">
        <section className="sponsor-page-header">
          <div>
            <p className="sponsor-section-eyebrow">{t("sponsors.details.eyebrow")}</p>
            <h1 className="sponsor-panel-title">{t("sponsors.details.title")}</h1>
            <p className="sponsor-muted-text">{t("sponsors.details.description")}</p>
          </div>
          <Link className="sponsor-button-secondary" to="/sponsors/my">
            {t("sponsors.common.back")}
          </Link>
        </section>

        {errorMessage ? <div className="sponsor-feedback sponsor-feedback-error">{errorMessage}</div> : null}

        {isLoading ? (
          <section className="sponsor-panel sponsor-loading-panel">{t("sponsors.details.loading")}</section>
        ) : sponsorship ? (
          <section className="sponsor-grid">
            <article className="sponsor-panel">
              <div className="sponsor-panel-header">
                <div>
                  <p className="sponsor-section-eyebrow">
                    {t("sponsors.details.contract")} #{sponsorship.sponsorshipId}
                  </p>
                  <h2 className="sponsor-panel-title">{resolveSponsorshipTarget(sponsorship, catalogs, t)}</h2>
                </div>
                <span className={sponsorshipStatusClass(sponsorship.status)}>
                  {sponsorshipStatusLabel(sponsorship.status, t)}
                </span>
              </div>

              <div className="sponsor-stat-grid">
                <div className="sponsor-stat-card">
                  <span className="sponsor-stat-label">{t("sponsors.fields.type")}</span>
                  <strong className="sponsor-stat-value">{sponsorTypeLabel(sponsorship.type, t)}</strong>
                </div>
                <div className="sponsor-stat-card">
                  <span className="sponsor-stat-label">{t("sponsors.fields.season")}</span>
                  <strong className="sponsor-stat-value">{sponsorship.season}</strong>
                </div>
                <div className="sponsor-stat-card">
                  <span className="sponsor-stat-label">{t("sponsors.fields.value")}</span>
                  <strong className="sponsor-stat-value">{formatCurrency(sponsorship.price)}</strong>
                </div>
              </div>

              {canPay ? (
                <div className="sponsor-form-actions">
                  <button className="sponsor-button-primary" disabled={isPaying} onClick={handlePay} type="button">
                    {isPaying ? t("sponsors.details.paymentStarting") : t("sponsors.details.pay")}
                  </button>
                </div>
              ) : null}
            </article>

            <aside className="sponsor-panel">
              <div className="sponsor-panel-header">
                <div>
                  <p className="sponsor-section-eyebrow">{t("sponsors.fields.sponsor")}</p>
                  <h2 className="sponsor-panel-title">{sponsor?.name ?? t("sponsors.fields.sponsor")}</h2>
                </div>
              </div>
              <div className="sponsor-contract-list">
                <div className="sponsor-empty-card">
                  <strong>{t("sponsors.fields.email")}</strong>
                  <p>{sponsor?.email ?? "-"}</p>
                </div>
                <div className="sponsor-empty-card">
                  <strong>{t("sponsors.fields.phone")}</strong>
                  <p>{sponsor?.phone ?? "-"}</p>
                </div>
                <div className="sponsor-empty-card">
                  <strong>{t("sponsors.fields.nif")}</strong>
                  <p>{sponsor?.nif ?? "-"}</p>
                </div>
              </div>
            </aside>
          </section>
        ) : null}
      </div>
    </main>
  );
}
