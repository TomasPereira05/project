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
  const { sponsorshipId } = useParams();
  const { catalogs, errorMessage, isLoading, sponsor, sponsorship } = useSponsorshipDetails(sponsorshipId);

  return (
    <main className="sponsor-page">
      <div className="sponsor-shell">
        <section className="sponsor-page-header">
          <div>
            <p className="sponsor-section-eyebrow">Detalhe</p>
            <h1 className="sponsor-panel-title">Patrocinio</h1>
            <p className="sponsor-muted-text">Informacao do pedido e do patrocinador associado.</p>
          </div>
          <Link className="sponsor-button-secondary" to="/sponsors/my">
            Voltar
          </Link>
        </section>

        {errorMessage ? <div className="sponsor-feedback sponsor-feedback-error">{errorMessage}</div> : null}

        {isLoading ? (
          <section className="sponsor-panel sponsor-loading-panel">A carregar patrocinio...</section>
        ) : sponsorship ? (
          <section className="sponsor-grid">
            <article className="sponsor-panel">
              <div className="sponsor-panel-header">
                <div>
                  <p className="sponsor-section-eyebrow">Contrato #{sponsorship.sponsorshipId}</p>
                  <h2 className="sponsor-panel-title">{resolveSponsorshipTarget(sponsorship, catalogs)}</h2>
                </div>
                <span className={sponsorshipStatusClass(sponsorship.status)}>
                  {sponsorshipStatusLabel(sponsorship.status)}
                </span>
              </div>

              <div className="sponsor-stat-grid">
                <div className="sponsor-stat-card">
                  <span className="sponsor-stat-label">Tipo</span>
                  <strong className="sponsor-stat-value">{sponsorTypeLabel(sponsorship.type)}</strong>
                </div>
                <div className="sponsor-stat-card">
                  <span className="sponsor-stat-label">Epoca</span>
                  <strong className="sponsor-stat-value">{sponsorship.season}</strong>
                </div>
                <div className="sponsor-stat-card">
                  <span className="sponsor-stat-label">Valor</span>
                  <strong className="sponsor-stat-value">{formatCurrency(sponsorship.price)}</strong>
                </div>
              </div>
            </article>

            <aside className="sponsor-panel">
              <div className="sponsor-panel-header">
                <div>
                  <p className="sponsor-section-eyebrow">Patrocinador</p>
                  <h2 className="sponsor-panel-title">{sponsor?.name ?? "Patrocinador"}</h2>
                </div>
              </div>
              <div className="sponsor-contract-list">
                <div className="sponsor-empty-card">
                  <strong>Email</strong>
                  <p>{sponsor?.email ?? "-"}</p>
                </div>
                <div className="sponsor-empty-card">
                  <strong>Telefone</strong>
                  <p>{sponsor?.phone ?? "-"}</p>
                </div>
                <div className="sponsor-empty-card">
                  <strong>NIF</strong>
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
