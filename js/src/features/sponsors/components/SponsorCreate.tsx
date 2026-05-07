import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, ShieldAlert } from "lucide-react";
import { createSponsor, createSponsorship, fetchCatalogSnapshot } from "..";
import type { CatalogSnapshot, SponsorFormValues, SponsorshipFormValues } from "..";
import { compareBySortOrder, resolveTeamSponsorshipPrice } from "..";
import { formatCurrency } from "../../../shared/utils";

const initialSponsorForm: SponsorFormValues = {
  name: "",
  email: "",
  phone: "",
  nif: "",
};

const initialSponsorshipForm: SponsorshipFormValues = {
  sponsorId: "",
  season: new Date().getFullYear().toString(),
  type: "PUB",
  pubOptionId: "",
  teamCategoryId: "",
  placementId: "",
  sportId: "",
};

export default function SponsorCreate() {
  const [catalogs, setCatalogs] = useState<CatalogSnapshot>({
    pubOptions: [],
    teamGroups: [],
    teamCategories: [],
    equipmentPlacements: [],
    otherSports: [],
    pubOptionPrices: [],
    teamGroupPrices: [],
    teamCategoryPriceOverrides: [],
    otherSportPrices: [],
  });
  const [sponsorForm, setSponsorForm] = useState<SponsorFormValues>(initialSponsorForm);
  const [selection, setSelection] = useState<SponsorshipFormValues>(initialSponsorshipForm);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [teamIndex, setTeamIndex] = useState(0);

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
          setErrorMessage(error instanceof Error ? error.message : "Nao foi possivel carregar as opcoes de patrocinio.");
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

  const pubCards = useMemo(
    () =>
      catalogs.pubOptions
        .map((item) => ({
          key: `PUB-${item.pubId}`,
          type: "PUB" as const,
          title: item.label,
          description: item.label,
          price: catalogs.pubOptionPrices.find((price) => price.pubOptionId === item.pubId)?.price ?? null,
          pubOptionId: item.pubId,
        }))
        .filter((item) => item.price != null),
    [catalogs.pubOptionPrices, catalogs.pubOptions],
  );

  const teamOptionGroups = useMemo(
    () =>
      catalogs.teamCategories
        .map((team) => ({
          team,
          options: catalogs.equipmentPlacements
            .map((placement) => ({
              key: `TEAM-${team.teamId}-${placement.equipmentId}`,
              type: "TEAM" as const,
              title: placement.label,
              description: `${team.label} / ${placement.label}`,
              price: resolveTeamSponsorshipPrice(team.teamId, team.teamGroupId, placement.equipmentId, catalogs),
              teamCategoryId: team.teamId,
              placementId: placement.equipmentId,
            }))
            .filter((item) => item.price != null),
        }))
        .filter((group) => group.options.length > 0),
    [catalogs],
  );

  const otherCards = useMemo(
    () =>
      catalogs.otherSports
        .map((item) => ({
          key: `OTHER-${item.sportId}`,
          type: "OTHER" as const,
          title: item.label,
          description: item.label,
          price: catalogs.otherSportPrices.find((price) => price.sportId === item.sportId)?.price ?? null,
          sportId: item.sportId,
        }))
        .filter((item) => item.price != null),
    [catalogs.otherSportPrices, catalogs.otherSports],
  );

  const availableOptions = useMemo(
    () => [...pubCards, ...teamOptionGroups.flatMap((group) => group.options), ...otherCards],
    [otherCards, pubCards, teamOptionGroups],
  );

  const currentTeamGroup = teamOptionGroups[teamIndex] ?? null;

  useEffect(() => {
    if (teamIndex >= teamOptionGroups.length) {
      setTeamIndex(Math.max(0, teamOptionGroups.length - 1));
    }
  }, [teamIndex, teamOptionGroups.length]);

  const selectedCard = useMemo(
    () =>
      availableOptions.find((item) => {
        if (selection.type !== item.type) {
          return false;
        }
        if (item.type === "PUB") {
          return selection.pubOptionId === String(item.pubOptionId);
        }
        if (item.type === "TEAM") {
          return selection.teamCategoryId === String(item.teamCategoryId) && selection.placementId === String(item.placementId);
        }
        return selection.sportId === String(item.sportId);
      }) ?? null,
    [availableOptions, selection],
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!selectedCard || selectedCard.price == null) {
      setErrorMessage("Escolhe uma opcao de patrocinio disponivel.");
      return;
    }

    try {
      const sponsor = await createSponsor(sponsorForm);
      await createSponsorship(
        {
          ...selection,
          sponsorId: String(sponsor.sponsorId),
        },
        selectedCard.price,
      );
      setSuccessMessage("Pedido de patrocinio submetido com sucesso. Ficara pendente de aprovacao.");
      setSponsorForm(initialSponsorForm);
      setSelection(initialSponsorshipForm);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Nao foi possivel submeter o patrocinio.");
    }
  }

  function selectOption(option: (typeof availableOptions)[number]) {
    if (option.type === "PUB") {
      setSelection((current) => ({
        ...current,
        type: "PUB",
        pubOptionId: String(option.pubOptionId),
        teamCategoryId: "",
        placementId: "",
        sportId: "",
      }));
    } else if (option.type === "TEAM") {
      setSelection((current) => ({
        ...current,
        type: "TEAM",
        pubOptionId: "",
        teamCategoryId: String(option.teamCategoryId),
        placementId: String(option.placementId),
        sportId: "",
      }));
    } else {
      setSelection((current) => ({
        ...current,
        type: "OTHER",
        pubOptionId: "",
        teamCategoryId: "",
        placementId: "",
        sportId: String(option.sportId),
      }));
    }
  }

  function changeSponsorType(type: SponsorshipFormValues["type"]) {
    setSelection((current) => ({
      ...current,
      type,
      pubOptionId: "",
      teamCategoryId: "",
      placementId: "",
      sportId: "",
    }));
  }

  function showPreviousTeam() {
    setTeamIndex((current) => (teamOptionGroups.length === 0 ? 0 : (current - 1 + teamOptionGroups.length) % teamOptionGroups.length));
  }

  function showNextTeam() {
    setTeamIndex((current) => (teamOptionGroups.length === 0 ? 0 : (current + 1) % teamOptionGroups.length));
  }

  return (
    <main className="sponsor-page">
      <div className="sponsor-shell">
        <section className="sponsor-page-header">
          <div>
            <p className="sponsor-section-eyebrow">Novo patrocinio</p>
            <h1 className="sponsor-panel-title">Criar pedido de patrocinio</h1>
            <p className="sponsor-muted-text">
              Preenche os teus dados e escolhe uma das opcoes ativas. O pedido sera registado como pendente.
            </p>
          </div>
          <Link className="sponsor-button-secondary" to="/sponsors">
            Voltar
          </Link>
        </section>

        {errorMessage ? (
          <div className="sponsor-feedback sponsor-feedback-error">
            <ShieldAlert size={18} />
            <span>{errorMessage}</span>
          </div>
        ) : null}

        {successMessage ? <div className="sponsor-feedback sponsor-feedback-success">{successMessage}</div> : null}

        <section className="sponsor-grid">
          <div className="sponsor-panel">
            <div className="sponsor-panel-header">
              <div>
                <p className="sponsor-section-eyebrow">Dados do patrocinador</p>
                <h2 className="sponsor-panel-title">Formulario</h2>
              </div>
            </div>

            <form className="sponsor-form-grid" onSubmit={handleSubmit}>
              <label className="sponsor-field">
                <span>Nome</span>
                <input className="sponsor-input" required value={sponsorForm.name} onChange={(e) => setSponsorForm((c) => ({ ...c, name: e.target.value }))} />
              </label>
              <label className="sponsor-field">
                <span>NIF</span>
                <input className="sponsor-input" required value={sponsorForm.nif} onChange={(e) => setSponsorForm((c) => ({ ...c, nif: e.target.value }))} />
              </label>
              <label className="sponsor-field">
                <span>Email</span>
                <input className="sponsor-input" required type="email" value={sponsorForm.email} onChange={(e) => setSponsorForm((c) => ({ ...c, email: e.target.value }))} />
              </label>
              <label className="sponsor-field">
                <span>Telefone</span>
                <input className="sponsor-input" required value={sponsorForm.phone} onChange={(e) => setSponsorForm((c) => ({ ...c, phone: e.target.value }))} />
              </label>
              <label className="sponsor-field sponsor-field-span">
                <span>Epoca</span>
                <input className="sponsor-input" required value={selection.season} onChange={(e) => setSelection((c) => ({ ...c, season: e.target.value }))} />
              </label>
              <div className="sponsor-form-actions sponsor-field-span">
                <button className="sponsor-button-primary" disabled={!selectedCard} type="submit">
                  Submeter patrocinio
                </button>
              </div>
            </form>
          </div>

          <div className="sponsor-panel">
            <div className="sponsor-panel-header">
              <div>
                <p className="sponsor-section-eyebrow">Opcoes disponiveis</p>
                <h2 className="sponsor-panel-title">Escolher patrocinio</h2>
              </div>
            </div>

            <div className="sponsor-type-tabs">
              <button
                className={`sponsor-type-tab ${selection.type === "PUB" ? "is-selected" : ""}`}
                onClick={() => changeSponsorType("PUB")}
                type="button"
              >
                Publicidade
              </button>
              <button
                className={`sponsor-type-tab ${selection.type === "TEAM" ? "is-selected" : ""}`}
                onClick={() => changeSponsorType("TEAM")}
                type="button"
              >
                Equipas
              </button>
              <button
                className={`sponsor-type-tab ${selection.type === "OTHER" ? "is-selected" : ""}`}
                onClick={() => changeSponsorType("OTHER")}
                type="button"
              >
                Outros
              </button>
            </div>

            {isLoading ? (
              <div className="sponsor-empty-card">A carregar opcoes...</div>
            ) : availableOptions.length === 0 ? (
              <div className="sponsor-empty-card">Nao existem opcoes com preco ativo neste momento.</div>
            ) : selection.type === "PUB" ? (
              pubCards.length === 0 ? (
                <div className="sponsor-empty-card">Nao existem opcoes de publicidade com preco ativo.</div>
              ) : (
                <div className="sponsor-option-grid">
                  {pubCards.map((option) => (
                    <SponsorOptionButton
                      isSelected={selectedCard?.key === option.key}
                      key={option.key}
                      option={option}
                      onSelect={() => selectOption(option)}
                    />
                  ))}
                </div>
              )
            ) : selection.type === "TEAM" ? (
              !currentTeamGroup ? (
                <div className="sponsor-empty-card">Nao existem opcoes de equipa com preco ativo.</div>
              ) : (
                <div className="sponsor-team-picker">
                  <div className="sponsor-team-picker-head">
                    <button className="sponsor-icon-button" onClick={showPreviousTeam} type="button" aria-label="Equipa anterior">
                      <ChevronLeft size={18} />
                    </button>
                    <div>
                      <p className="sponsor-section-eyebrow">Equipa {teamIndex + 1} de {teamOptionGroups.length}</p>
                      <h3>{currentTeamGroup.team.label}</h3>
                    </div>
                    <button className="sponsor-icon-button" onClick={showNextTeam} type="button" aria-label="Equipa seguinte">
                      <ChevronRight size={18} />
                    </button>
                  </div>
                  <div className="sponsor-option-grid">
                    {currentTeamGroup.options.map((option) => (
                      <SponsorOptionButton
                        isSelected={selectedCard?.key === option.key}
                        key={option.key}
                        option={option}
                        onSelect={() => selectOption(option)}
                      />
                    ))}
                  </div>
                </div>
              )
            ) : otherCards.length === 0 ? (
              <div className="sponsor-empty-card">Nao existem outras opcoes com preco ativo.</div>
            ) : (
              <div className="sponsor-option-grid">
                {otherCards.map((option) => (
                  <SponsorOptionButton
                    isSelected={selectedCard?.key === option.key}
                    key={option.key}
                    option={option}
                    onSelect={() => selectOption(option)}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function SponsorOptionButton({
  option,
  isSelected,
  onSelect,
}: {
  option: {
    type: "PUB" | "TEAM" | "OTHER";
    title: string;
    description: string;
    price: number | null;
  };
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      className={`sponsor-option-card ${isSelected ? "is-selected" : ""}`}
      onClick={onSelect}
      type="button"
    >
      <div>
        <span className="sponsor-badge sponsor-badge-approved">{option.type}</span>
        <h3>{option.title}</h3>
        <p>{option.description}</p>
      </div>
      <strong>{option.price == null ? "-" : formatCurrency(option.price)}</strong>
    </button>
  );
}
