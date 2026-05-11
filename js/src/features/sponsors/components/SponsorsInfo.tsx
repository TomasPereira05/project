import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Settings, ShieldAlert, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { fetchCatalogSnapshot } from "..";
import type { CatalogSnapshot } from "..";
import { compareBySortOrder, resolveTeamSponsorshipPrice } from "..";
import { useAuth } from "../../../shared/hooks/useAuth";
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

export default function SponsorsInfo() {
  const { role } = useAuth();
  const canManage = role === "ADMIN" || role === "SECRETARIA";
  const [catalogs, setCatalogs] = useState<CatalogSnapshot>(emptyCatalogs);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadCatalogs() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const response = await fetchCatalogSnapshot();
        if (!ignore) {
          setCatalogs({
            ...response,
            pubOptions: [...response.pubOptions].sort(compareBySortOrder),
            teamGroups: [...response.teamGroups].sort(compareBySortOrder),
            teamCategories: [...response.teamCategories].sort(compareBySortOrder),
            equipmentPlacements: [...response.equipmentPlacements].sort(compareBySortOrder),
            otherSports: [...response.otherSports].sort(compareBySortOrder),
          });
        }
      } catch (error) {
        if (!ignore) {
          setErrorMessage(error instanceof Error ? error.message : "Nao foi possivel carregar a tabela de patrocinio.");
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    void loadCatalogs();
    return () => {
      ignore = true;
    };
  }, []);

  const pubRows = useMemo(
    () =>
      catalogs.pubOptions
        .map((option) => ({
          id: option.pubId,
          label: option.label,
          code: option.code,
          price: catalogs.pubOptionPrices.find((price) => price.pubOptionId === option.pubId)?.price ?? null,
          available: option.available,
          free: option.free,
          occupied: option.occupied,
        }))
        .filter((row) => row.price != null),
    [catalogs],
  );

  const otherRows = useMemo(
    () =>
      catalogs.otherSports
        .map((sport) => ({
          id: sport.sportId,
          label: sport.label,
          code: sport.code,
          price: catalogs.otherSportPrices.find((price) => price.sportId === sport.sportId)?.price ?? null,
        }))
        .filter((row) => row.price != null),
    [catalogs],
  );

  const teamColumns = useMemo(() => {
    const publicGroupCodes = new Set(["FUT11", "FUT9", "FUT7"]);
    const groupColumns = catalogs.teamGroups
      .filter((group) => publicGroupCodes.has(group.code.toUpperCase()))
      .filter((group) => catalogs.teamGroupPrices.some((price) => price.teamGroupId === group.teamGroupId))
      .map((group) => ({
        id: `group-${group.teamGroupId}`,
        label: group.label,
        resolvePrice: (placementId: number) =>
          catalogs.teamGroupPrices.find(
            (entry) => entry.teamGroupId === group.teamGroupId && entry.placementId === placementId,
          )?.price ?? null,
      }));

    const overrideColumns = catalogs.teamCategories
      .filter((team) =>
        catalogs.teamCategoryPriceOverrides.some((override) => override.teamCategoryId === team.teamId),
      )
      .map((team) => ({
        id: `team-${team.teamId}`,
        label: team.label,
        resolvePrice: (placementId: number) =>
          resolveTeamSponsorshipPrice(team.teamId, team.teamGroupId, placementId, catalogs),
      }));

    return [...overrideColumns, ...groupColumns];
  }, [catalogs]);

  const teamMatrix = useMemo(
    () =>
      catalogs.equipmentPlacements.map((placement) => ({
        placement,
        values: teamColumns.map((column) => ({
          id: column.id,
          label: column.label,
          price: column.resolvePrice(placement.equipmentId),
        })),
      })),
    [catalogs.equipmentPlacements, teamColumns],
  );

  return (
    <main className="sponsor-page">
      <div className="sponsor-shell">
        <section className="sponsor-hero">
          <div className="sponsor-hero-copy">
            <p className="sponsor-kicker">Patrocinios</p>
            <h1 className="sponsor-title">Patrocinios & Publicidade 2024/25</h1>
            <p className="sponsor-description">
              Fundado em 1921, o Grupo Desportivo Uniao Ericeirense e um clube local com uma clara aposta na
              formacao e no desenvolvimento dos nossos jovens, nas dimensoes tecnicas, humanas e sociais.
            </p>
            <p className="sponsor-description">
              E com grande satisfacao que olhamos para a evolucao feita nos ultimos anos, onde registamos um
              crescimento significativo de atletas, presentes em todos os escaloes e com niveis de desempenho
              que nos orgulham.
            </p>
            <p className="sponsor-description">
              Queremos continuar a crescer e fazer do GDUE uma referencia no futebol de formacao do nosso distrito.
              Para isso, contamos com a contribuicao de quem se identifica com os nossos valores e com a nossa ambicao.
            </p>
            <div className="sponsor-hero-actions">
              <Link className="sponsor-button-primary" to="/sponsors/create">
                Criar patrocinio
                <ArrowRight size={16} />
              </Link>
              {canManage ? (
                <>
                  <Link className="sponsor-button-secondary" to="/sponsors/approvals">
                    <ShieldCheck size={16} />
                    Aprovar pedidos
                  </Link>
                  <Link className="sponsor-button-secondary" to="/sponsors/settings">
                    <Settings size={16} />
                    Settings
                  </Link>
                </>
              ) : null}
            </div>
          </div>
          <div className="sponsor-highlight-card">
            <p className="sponsor-highlight-label">Torne-se nosso patrocinador</p>
            <strong className="sponsor-highlight-value">Em 3 passos</strong>
            <span className="sponsor-highlight-meta">
              Preencher o formulario, escolher a modalidade e aguardar aprovacão.
            </span>
          </div>
        </section>

        {errorMessage ? (
          <div className="sponsor-feedback sponsor-feedback-error">
            <ShieldAlert size={18} />
            <span>{errorMessage}</span>
          </div>
        ) : null}

        <section className="sponsor-brochure-grid">
          <article className="sponsor-brochure-card sponsor-brochure-copy">
            <h2>Pacote PUB</h2>
            <ul className="sponsor-brochure-list">
              <li>Lona interior ou outdoor</li>
              <li>Presenca mural digital no site</li>
            </ul>
          </article>

          <article className="sponsor-brochure-card sponsor-brochure-table-card">
            <div className="sponsor-table-headline">
              <h3>Tabela PUB</h3>
              <span>{isLoading ? "A carregar..." : `${pubRows.length} opcoes`}</span>
            </div>
            {pubRows.length === 0 ? (
              <div className="sponsor-empty-card">Sem opcoes PUB com preco configurado.</div>
            ) : (
              <div className="sponsor-table-wrapper">
                <table className="sponsor-table">
                  <thead>
                    <tr>
                      <th>Descritivo</th>
                      <th>Livre</th>
                      <th>Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pubRows.map((row) => (
                      <tr key={row.id}>
                        <td>{row.label}</td>
                        <td>{row.free}</td>
                        <td>{row.price == null ? "-" : formatCurrency(row.price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </article>
        </section>

        <section className="sponsor-brochure-grid sponsor-brochure-grid-wide">
          <article className="sponsor-brochure-card sponsor-brochure-copy">
            <h2>Pacote Equipa</h2>
            <ul className="sponsor-brochure-list">
              <li>Lona interior 3,00m x 0,80m</li>
              <li>Presenca nos equipamentos</li>
              <li>Presenca mural digital no site</li>
              <li>Presenca no mapa de classificacoes semanal</li>
            </ul>
          </article>

          <article className="sponsor-brochure-card sponsor-brochure-table-card">
            <div className="sponsor-table-headline">
              <h3>Tabela Equipa</h3>
              <span>{isLoading ? "A carregar..." : `${teamColumns.length} opcoes`}</span>
            </div>
            {teamColumns.length === 0 || catalogs.equipmentPlacements.length === 0 ? (
              <div className="sponsor-empty-card">Sem combinacoes de equipa configuradas.</div>
            ) : (
              <div className="sponsor-table-wrapper">
                <table className="sponsor-table">
                  <thead>
                    <tr>
                      <th>Equipamento</th>
                      {teamColumns.map((column) => (
                        <th key={column.id}>{column.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {teamMatrix.map((row) => (
                      <tr key={row.placement.equipmentId}>
                        <td>{row.placement.label}</td>
                        {row.values.map((value) => (
                          <td key={`${row.placement.equipmentId}-${value.id}`}>
                            {value.price == null ? "-" : formatCurrency(value.price)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </article>
        </section>

        <section className="sponsor-brochure-grid">
          <article className="sponsor-brochure-card sponsor-brochure-copy">
            <h2>Outras Modalidades</h2>
            <ul className="sponsor-brochure-list">
              <li>Patinagem, Voleibol, Futebol Praia, Golf e outras opcoes ativas</li>
            </ul>
          </article>

          <article className="sponsor-brochure-card sponsor-brochure-table-card">
            <div className="sponsor-table-headline">
              <h3>Tabela Outro</h3>
              <span>{isLoading ? "A carregar..." : `${otherRows.length} modalidades`}</span>
            </div>
            {otherRows.length === 0 ? (
              <div className="sponsor-empty-card">Sem modalidades extra com preco configurado.</div>
            ) : (
              <div className="sponsor-table-wrapper">
                <table className="sponsor-table">
                  <thead>
                    <tr>
                      <th>Modalidade</th>
                      <th>Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {otherRows.map((row) => (
                      <tr key={row.id}>
                        <td>{row.label}</td>
                        <td>{row.price == null ? "-" : formatCurrency(row.price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </article>
        </section>
      </div>
    </main>
  );
}
