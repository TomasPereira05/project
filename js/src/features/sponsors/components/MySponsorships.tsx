import { useMemo } from "react";
import { Link } from "react-router-dom";
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
  const { catalogs, errorMessage, isLoading, items } = useMySponsorships();
  const totals = useMemo(() => calculateMySponsorshipTotals(items), [items]);

  return (
    <main className="sponsor-page">
      <div className="sponsor-shell">
        <section className="sponsor-page-header">
          <div>
            <p className="sponsor-section-eyebrow">Area reservada</p>
            <h1 className="sponsor-panel-title">Meus patrocinios</h1>
            <p className="sponsor-muted-text">Consulta os pedidos e contratos associados a esta conta.</p>
          </div>
          <Link className="sponsor-button-secondary" to="/sponsors/info">
            Ver opcoes
          </Link>
        </section>

        {errorMessage ? <div className="sponsor-feedback sponsor-feedback-error">{errorMessage}</div> : null}

        <section className="sponsor-stat-grid">
          <div className="sponsor-stat-card">
            <span className="sponsor-stat-label">Total</span>
            <strong className="sponsor-stat-value">{totals.count}</strong>
          </div>
          <div className="sponsor-stat-card">
            <span className="sponsor-stat-label">Submetidos</span>
            <strong className="sponsor-stat-value">{totals.pending}</strong>
          </div>
          <div className="sponsor-stat-card">
            <span className="sponsor-stat-label">Valor ativo</span>
            <strong className="sponsor-stat-value">{formatCurrency(totals.value)}</strong>
          </div>
        </section>

        <section className="sponsor-panel">
          <div className="sponsor-panel-header">
            <div>
              <p className="sponsor-section-eyebrow">Contratos</p>
              <h2 className="sponsor-panel-title">Lista</h2>
            </div>
          </div>

          {isLoading ? (
            <div className="sponsor-empty-card">A carregar patrocinios...</div>
          ) : items.length === 0 ? (
            <div className="sponsor-empty-card">Ainda nao existem patrocinios associados a esta conta.</div>
          ) : (
            <div className="sponsor-contract-list">
              {items.map(({ sponsor, sponsorship }) => (
                <article className="sponsor-contract-card" key={sponsorship.sponsorshipId}>
                  <div className="sponsor-contract-main">
                    <div>
                      <div className="sponsor-contract-topline">
                        <span className={sponsorshipStatusClass(sponsorship.status)}>
                          {sponsorshipStatusLabel(sponsorship.status)}
                        </span>
                        <span className="sponsor-price-pill">{formatCurrency(sponsorship.price)}</span>
                      </div>
                      <h3 className="sponsor-contract-target">
                        {resolveSponsorshipTarget(sponsorship, catalogs)}
                      </h3>
                      <p className="sponsor-contract-meta">
                        {sponsorTypeLabel(sponsorship.type)} · Epoca {sponsorship.season}
                        {sponsor ? ` · ${sponsor.name}` : ""}
                      </p>
                    </div>
                    <div className="sponsor-contract-actions">
                      <Link className="sponsor-button-secondary" to={`/sponsors/my/${sponsorship.sponsorshipId}`}>
                        Detalhes
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
