import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchCatalogSnapshot,
  fetchMySponsorships,
  fetchSponsorById,
  resolveSponsorshipTarget,
  sponsorshipStatusClass,
  sponsorshipStatusLabel,
  sponsorTypeLabel,
} from "..";
import type { CatalogSnapshot, Sponsor, Sponsorship } from "..";
import { formatCurrency } from "../../../shared/utils";

type SponsorshipRow = {
  sponsor: Sponsor | null;
  sponsorship: Sponsorship;
};

const emptyCatalogs: CatalogSnapshot = {
  pubOptions: [],
  teamGroups: [],
  teamCategories: [],
  equipmentPlacements: [],
  otherSports: [],
  pubOptionPrices: [],
  teamGroupPrices: [],
  teamCategoryPriceOverrides: [],
  otherSportPrices: [],
};

export default function MySponsorships() {
  const [items, setItems] = useState<SponsorshipRow[]>([]);
  const [catalogs, setCatalogs] = useState<CatalogSnapshot>(emptyCatalogs);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadSponsorships() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const [sponsorships, catalogSnapshot] = await Promise.all([
          fetchMySponsorships(),
          fetchCatalogSnapshot(),
        ]);
        const sponsorIds = Array.from(new Set(sponsorships.map((item) => item.sponsorId)));
        const sponsors = await Promise.all(sponsorIds.map((sponsorId) => fetchSponsorById(sponsorId)));
        const sponsorsById = new Map(sponsors.map((sponsor) => [sponsor.sponsorId, sponsor]));

        if (!ignore) {
          setCatalogs(catalogSnapshot);
          setItems(
            sponsorships.map((sponsorship) => ({
              sponsorship,
              sponsor: sponsorsById.get(sponsorship.sponsorId) ?? null,
            })),
          );
        }
      } catch (error) {
        if (!ignore) {
          setErrorMessage(error instanceof Error ? error.message : "Nao foi possivel carregar os patrocinios.");
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    void loadSponsorships();

    return () => {
      ignore = true;
    };
  }, []);

  const totals = useMemo(() => {
    const activeItems = items.filter(({ sponsorship }) => sponsorship.status !== "CANCELADO");
    return {
      count: items.length,
      pending: items.filter(({ sponsorship }) => sponsorship.status === "SUBMETIDO").length,
      value: activeItems.reduce((sum, { sponsorship }) => sum + sponsorship.price, 0),
    };
  }, [items]);

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
