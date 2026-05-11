import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  fetchCatalogSnapshot,
  fetchSponsorById,
  fetchSponsorshipById,
  resolveSponsorshipTarget,
  sponsorshipStatusClass,
  sponsorshipStatusLabel,
  sponsorTypeLabel,
} from "..";
import type { CatalogSnapshot, Sponsor, Sponsorship } from "..";
import { formatCurrency } from "../../../shared/utils";

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

export default function SponsorshipDetails() {
  const { sponsorshipId } = useParams();
  const [sponsorship, setSponsorship] = useState<Sponsorship | null>(null);
  const [sponsor, setSponsor] = useState<Sponsor | null>(null);
  const [catalogs, setCatalogs] = useState<CatalogSnapshot>(emptyCatalogs);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let ignore = false;
    const parsedId = Number.parseInt(sponsorshipId ?? "", 10);

    async function loadSponsorship() {
      if (!Number.isFinite(parsedId)) {
        setErrorMessage("Patrocinio invalido.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage("");

      try {
        const [sponsorshipResult, catalogSnapshot] = await Promise.all([
          fetchSponsorshipById(parsedId),
          fetchCatalogSnapshot(),
        ]);
        const sponsorResult = await fetchSponsorById(sponsorshipResult.sponsorId);

        if (!ignore) {
          setSponsorship(sponsorshipResult);
          setSponsor(sponsorResult);
          setCatalogs(catalogSnapshot);
        }
      } catch (error) {
        if (!ignore) {
          setErrorMessage(error instanceof Error ? error.message : "Nao foi possivel carregar o patrocinio.");
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    void loadSponsorship();

    return () => {
      ignore = true;
    };
  }, [sponsorshipId]);

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
