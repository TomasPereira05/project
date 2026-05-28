import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useParams } from "react-router-dom";
import { Edit3, Save, X } from "lucide-react";
import { useAuth } from "../../../shared/hooks/useAuth";
import { centsFromEuroInput, euroInputFromCents, formatCurrency } from "../../../shared/utils";
import { BASE_URL, HERO_IMG_SRC } from "../../../shared/config/config";
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
  const location = useLocation();
  const { role } = useAuth();
  const { catalogs, errorMessage, feedback, handlePay, handleSave, isLoading, isPaying, isSaving, sponsor, sponsorship } =
    useSponsorshipDetails(sponsorshipId);
  const canManage = role === "ADMIN" || role === "SECRETARIA";
  const canPay = sponsorship?.status === "APROVADO";
  const canViewReceipt = sponsorship?.status === "PAGO" || sponsorship?.status === "ATIVO";
  const locationState = location.state as { backPath?: string } | null;
  const backPath = locationState?.backPath ?? (location.pathname.startsWith("/admin")
    ? "/admin/sponsors/approvals"
    : "/sponsors/my");
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    email: "",
    phone: "",
    nif: "",
    price: "",
    otherDetails: "",
  });

  useEffect(() => {
    if (!sponsorship || !sponsor) {
      return;
    }

    setForm({
      email: sponsor.email,
      phone: sponsor.phone,
      nif: sponsor.nif,
      price: euroInputFromCents(sponsorship.price),
      otherDetails: sponsorship.otherDetails ?? "",
    });
  }, [sponsor, sponsorship]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const saved = await handleSave({
      email: form.email,
      phone: form.phone,
      nif: form.nif,
      price: canManage ? centsFromEuroInput(form.price) : null,
      otherDetails: canManage && sponsorship?.type === "OTHER" ? form.otherDetails : null,
    });
    if (saved) {
      setIsEditing(false);
    }
  }

  function cancelEdit() {
    if (sponsorship && sponsor) {
      setForm({
        email: sponsor.email,
        phone: sponsor.phone,
        nif: sponsor.nif,
        price: euroInputFromCents(sponsorship.price),
        otherDetails: sponsorship.otherDetails ?? "",
      });
    }
    setIsEditing(false);
  }

  return (
    <main className="sponsor-page">
      <div className="member-form-bg" style={{ backgroundImage: `url(${HERO_IMG_SRC})` }} />
      <div className="member-form-overlay" />
      <div className="sponsor-shell">
        <section className="sponsor-detail-glass">
          <header className="sponsor-page-header">
            <div>
              <p className="sponsor-section-eyebrow">{t("sponsors.details.eyebrow")}</p>
              <h1 className="sponsor-panel-title">{t("sponsors.details.title")}</h1>
              <p className="sponsor-muted-text">{t("sponsors.details.description")}</p>
            </div>
            <Link className="sponsor-button-secondary sponsor-detail-back" to={backPath}>
              {t("sponsors.common.back")}
            </Link>
          </header>

          {errorMessage ? <div className="sponsor-feedback sponsor-feedback-error">{errorMessage}</div> : null}
          {feedback ? <div className="sponsor-feedback sponsor-feedback-success">{feedback}</div> : null}

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

                {sponsorship.type === "OTHER" && sponsorship.otherDetails ? (
                  <div className="sponsor-detail-description sponsor-empty-card">
                    <strong>{t("sponsors.fields.otherDetails")}</strong>
                    <p>{sponsorship.otherDetails}</p>
                  </div>
                ) : null}

                {canPay ? (
                  <div className="sponsor-form-actions">
                    <button className="sponsor-button-primary" disabled={isPaying} onClick={handlePay} type="button">
                      {isPaying ? t("sponsors.details.paymentStarting") : t("sponsors.details.pay")}
                    </button>
                  </div>
                ) : null}
                {canViewReceipt ? (
                  <div className="sponsor-form-actions">
                    <a className="sponsor-button-secondary" href={`${BASE_URL}/payments/sponsorships/${sponsorship.sponsorshipId}/receipt`} target="_blank" rel="noreferrer">
                      {t("sponsors.details.viewReceipt")}
                    </a>
                  </div>
                ) : null}
              </article>

              <aside className="sponsor-panel">
                <div className="sponsor-panel-header">
                  <div>
                    <p className="sponsor-section-eyebrow">{t("sponsors.fields.sponsor")}</p>
                    <h2 className="sponsor-panel-title">{sponsor?.name ?? t("sponsors.fields.sponsor")}</h2>
                  </div>
                  {!isEditing ? (
                    <button className="sponsor-icon-button" onClick={() => setIsEditing(true)} title={t("sponsors.details.edit")} type="button">
                      <Edit3 size={18} />
                    </button>
                  ) : null}
                </div>
                {isEditing ? (
                  <form className="sponsor-form-grid" onSubmit={onSubmit}>
                    <label className="sponsor-field">
                      {t("sponsors.fields.email")}
                      <input
                        className="sponsor-input"
                        onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                        required
                        type="email"
                        value={form.email}
                      />
                    </label>
                    <label className="sponsor-field">
                      {t("sponsors.fields.phone")}
                      <input
                        className="sponsor-input"
                        onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                        required
                        value={form.phone}
                      />
                    </label>
                    <label className="sponsor-field">
                      {t("sponsors.fields.nif")}
                      <input
                        className="sponsor-input"
                        onChange={(event) => setForm((current) => ({ ...current, nif: event.target.value }))}
                        required
                        value={form.nif}
                      />
                    </label>
                    {canManage ? (
                      <label className="sponsor-field">
                        {t("sponsors.fields.price")}
                        <input
                          className="sponsor-input"
                          inputMode="decimal"
                          min="0"
                          onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))}
                          required
                          step="0.01"
                          type="number"
                          value={form.price}
                        />
                      </label>
                    ) : null}
                    {canManage && sponsorship.type === "OTHER" ? (
                      <label className="sponsor-field sponsor-field-span">
                        {t("sponsors.fields.otherDetails")}
                        <textarea
                          className="sponsor-input sponsor-textarea"
                          onChange={(event) => setForm((current) => ({ ...current, otherDetails: event.target.value }))}
                          required
                          value={form.otherDetails}
                        />
                      </label>
                    ) : null}
                    <div className="sponsor-form-actions sponsor-field-span">
                      <button className="sponsor-button-primary" disabled={isSaving} type="submit">
                        <Save size={16} />
                        {isSaving ? t("sponsors.details.saving") : t("sponsors.details.save")}
                      </button>
                      <button className="sponsor-button-secondary" disabled={isSaving} onClick={cancelEdit} type="button">
                        <X size={16} />
                        {t("sponsors.details.cancelEdit")}
                      </button>
                    </div>
                  </form>
                ) : (
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
                )}
              </aside>
            </section>
          ) : null}
        </section>
      </div>
    </main>
  );
}
