import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, ShieldAlert } from "lucide-react";
import { createSponsorshipWithSponsor, fetchUserByUsername } from "..";
import type { SponsorFormValues, SponsorshipFormValues } from "..";
import { formatCurrency } from "../../../shared/utils";
import { useAuth } from "../../../shared/hooks/useAuth";
import { useSponsorCatalogs } from "../hooks";
import { buildOtherSponsorshipCards, buildPubSponsorshipCards, buildTeamSponsorshipGroups } from "../utils";

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
  const { id: currentUserId, role } = useAuth();
  const { catalogs, errorMessage: catalogErrorMessage, isLoading } = useSponsorCatalogs({
    errorMessage: "Nao foi possivel carregar as opcoes de patrocinio.",
  });
  const [sponsorForm, setSponsorForm] = useState<SponsorFormValues>(initialSponsorForm);
  const [selection, setSelection] = useState<SponsorshipFormValues>(initialSponsorshipForm);
  const [userMode, setUserMode] = useState<"none" | "self" | "username">("none");
  const [usernameSearch, setUsernameSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<{ userId: number; username: string; email: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [teamIndex, setTeamIndex] = useState(0);
  const isAdmin = role === "ADMIN";

  const displayErrorMessage = errorMessage || catalogErrorMessage;

  const pubCards = useMemo(() => buildPubSponsorshipCards(catalogs), [catalogs]);

  const teamOptionGroups = useMemo(() => buildTeamSponsorshipGroups(catalogs), [catalogs]);

  const otherCards = useMemo(() => buildOtherSponsorshipCards(catalogs), [catalogs]);

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

    const userId =
      isAdmin && userMode === "self"
        ? currentUserId ?? null
        : isAdmin && userMode === "username"
          ? selectedUser?.userId ?? null
          : null;

    if (isAdmin && userMode === "username" && !userId) {
      setErrorMessage("Pesquisa e seleciona um utilizador antes de submeter.");
      return;
    }

    try {
      await createSponsorshipWithSponsor(sponsorForm, selection, selectedCard.price, userId);
      setSuccessMessage("Pedido de patrocinio submetido com sucesso. Ficara pendente de aprovacao.");
      setSponsorForm(initialSponsorForm);
      setSelection(initialSponsorshipForm);
      setUsernameSearch("");
      setSelectedUser(null);
      setUserMode("none");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Nao foi possivel submeter o patrocinio.");
    }
  }

  async function handleUserSearch() {
    setErrorMessage("");
    setSelectedUser(null);

    if (!usernameSearch.trim()) {
      setErrorMessage("Indica um username para procurar.");
      return;
    }

    try {
      const user = await fetchUserByUsername(usernameSearch);
      setSelectedUser(user);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Nao foi possivel encontrar esse utilizador.");
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

        {displayErrorMessage ? (
          <div className="sponsor-feedback sponsor-feedback-error">
            <ShieldAlert size={18} />
            <span>{displayErrorMessage}</span>
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
              {isAdmin ? (
                <div className="sponsor-field sponsor-field-span">
                  <span>Conta associada</span>
                  <div className="sponsor-type-tabs">
                    <button className={`sponsor-type-tab ${userMode === "none" ? "is-selected" : ""}`} onClick={() => setUserMode("none")} type="button">
                      Nenhuma
                    </button>
                    <button className={`sponsor-type-tab ${userMode === "self" ? "is-selected" : ""}`} onClick={() => setUserMode("self")} type="button">
                      Eu
                    </button>
                    <button className={`sponsor-type-tab ${userMode === "username" ? "is-selected" : ""}`} onClick={() => setUserMode("username")} type="button">
                      Username
                    </button>
                  </div>
                  {userMode === "username" ? (
                    <div className="sponsor-inline-editor">
                      <input
                        className="sponsor-input"
                        placeholder="username"
                        value={usernameSearch}
                        onChange={(e) => {
                          setUsernameSearch(e.target.value);
                          setSelectedUser(null);
                        }}
                      />
                      <button className="sponsor-button-secondary" onClick={handleUserSearch} type="button">
                        Procurar
                      </button>
                    </div>
                  ) : null}
                  {selectedUser ? (
                    <p className="sponsor-muted-text">Selecionado: {selectedUser.username} ({selectedUser.email})</p>
                  ) : null}
                </div>
              ) : null}
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
    free?: number;
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
        <p>{option.description}{option.type === "PUB" && option.free != null ? ` - ${option.free} livres` : ""}</p>
      </div>
      <strong>{option.price == null ? "-" : formatCurrency(option.price)}</strong>
    </button>
  );
}
