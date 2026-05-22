import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, ShieldAlert } from "lucide-react";
import { createSponsorshipWithSponsor, fetchUserByUsername } from "..";
import type { SponsorFormValues, SponsorshipFormValues } from "..";
import { formatCurrency } from "../../../shared/utils";
import { useAuth } from "../../../shared/hooks/useAuth";
import { HERO_IMG_SRC } from "../../../shared/config/config";
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
  otherDetails: "",
};

export default function SponsorCreate() {
  const { t } = useTranslation();
  const { id: currentUserId, role } = useAuth();
  const { catalogs, errorMessage: catalogErrorMessage, isLoading } = useSponsorCatalogs({
    errorMessage: t("sponsors.create.errors.loadOptions"),
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

  const teamOptionGroups = useMemo(() => buildTeamSponsorshipGroups(catalogs, selection.season.trim()), [catalogs, selection.season]);

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
      setErrorMessage(t("sponsors.create.errors.selectOption"));
      return;
    }

    const userId =
      isAdmin && userMode === "self"
        ? currentUserId ?? null
        : isAdmin && userMode === "username"
          ? selectedUser?.userId ?? null
          : null;

    if (isAdmin && userMode === "username" && !userId) {
      setErrorMessage(t("sponsors.create.errors.selectUser"));
      return;
    }

    try {
      await createSponsorshipWithSponsor(sponsorForm, selection, selectedCard.price, userId);
      setSuccessMessage(t("sponsors.create.success"));
      setSponsorForm(initialSponsorForm);
      setSelection(initialSponsorshipForm);
      setUsernameSearch("");
      setSelectedUser(null);
      setUserMode("none");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t("sponsors.create.errors.submit"));
    }
  }

  async function handleUserSearch() {
    setErrorMessage("");
    setSelectedUser(null);

    if (!usernameSearch.trim()) {
      setErrorMessage(t("sponsors.create.errors.usernameRequired"));
      return;
    }

    try {
      const user = await fetchUserByUsername(usernameSearch);
      setSelectedUser(user);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t("sponsors.create.errors.userNotFound"));
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
        otherDetails: "",
      }));
    } else if (option.type === "TEAM") {
      setSelection((current) => ({
        ...current,
        type: "TEAM",
        pubOptionId: "",
        teamCategoryId: String(option.teamCategoryId),
        placementId: String(option.placementId),
        sportId: "",
        otherDetails: "",
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
      otherDetails: "",
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
      <div className="member-form-bg" style={{ backgroundImage: `url(${HERO_IMG_SRC})` }} />
      <div className="member-form-overlay" />
      <div className="sponsor-shell">
        <section className="sponsor-page-header">
          <div>
            <p className="sponsor-section-eyebrow">{t("sponsors.create.eyebrow")}</p>
            <h1 className="sponsor-panel-title">{t("sponsors.create.title")}</h1>
            <p className="sponsor-muted-text">{t("sponsors.create.description")}</p>
          </div>
          <Link className="sponsor-button-secondary" to="/sponsors">
            {t("sponsors.common.back")}
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
                <p className="sponsor-section-eyebrow">{t("sponsors.create.sponsorData")}</p>
                <h2 className="sponsor-panel-title">{t("sponsors.create.form")}</h2>
              </div>
            </div>

            <form className="sponsor-form-grid" onSubmit={handleSubmit}>
              <label className="sponsor-field">
                <span>{t("sponsors.fields.name")}</span>
                <input className="sponsor-input" required value={sponsorForm.name} onChange={(e) => setSponsorForm((c) => ({ ...c, name: e.target.value }))} />
              </label>
              <label className="sponsor-field">
                <span>{t("sponsors.fields.nif")}</span>
                <input className="sponsor-input" required value={sponsorForm.nif} onChange={(e) => setSponsorForm((c) => ({ ...c, nif: e.target.value }))} />
              </label>
              <label className="sponsor-field">
                <span>{t("sponsors.fields.email")}</span>
                <input className="sponsor-input" required type="email" value={sponsorForm.email} onChange={(e) => setSponsorForm((c) => ({ ...c, email: e.target.value }))} />
              </label>
              <label className="sponsor-field">
                <span>{t("sponsors.fields.phone")}</span>
                <input className="sponsor-input" required value={sponsorForm.phone} onChange={(e) => setSponsorForm((c) => ({ ...c, phone: e.target.value }))} />
              </label>
              <label className="sponsor-field sponsor-field-span">
                <span>{t("sponsors.fields.season")}</span>
                <input className="sponsor-input" required value={selection.season} onChange={(e) => setSelection((c) => ({ ...c, season: e.target.value }))} />
              </label>
              {isAdmin ? (
                <div className="sponsor-field sponsor-field-span">
                  <span>{t("sponsors.create.linkedAccount")}</span>
                  <div className="sponsor-type-tabs">
                    <button className={`sponsor-type-tab ${userMode === "none" ? "is-selected" : ""}`} onClick={() => setUserMode("none")} type="button">
                      {t("sponsors.create.accountModes.none")}
                    </button>
                    <button className={`sponsor-type-tab ${userMode === "self" ? "is-selected" : ""}`} onClick={() => setUserMode("self")} type="button">
                      {t("sponsors.create.accountModes.self")}
                    </button>
                    <button className={`sponsor-type-tab ${userMode === "username" ? "is-selected" : ""}`} onClick={() => setUserMode("username")} type="button">
                      {t("sponsors.create.accountModes.username")}
                    </button>
                  </div>
                  {userMode === "username" ? (
                    <div className="sponsor-inline-editor">
                      <input
                        className="sponsor-input"
                        placeholder={t("sponsors.create.usernamePlaceholder")}
                        value={usernameSearch}
                        onChange={(e) => {
                          setUsernameSearch(e.target.value);
                          setSelectedUser(null);
                        }}
                      />
                      <button className="sponsor-button-secondary" onClick={handleUserSearch} type="button">
                        {t("sponsors.create.search")}
                      </button>
                    </div>
                  ) : null}
                  {selectedUser ? (
                    <p className="sponsor-muted-text">{t("sponsors.create.selectedUser", { username: selectedUser.username, email: selectedUser.email })}</p>
                  ) : null}
                </div>
              ) : null}
              {selection.type === "OTHER" ? (
                <label className="sponsor-field sponsor-field-span">
                  <span>{t("sponsors.fields.otherDetails")}</span>
                  <textarea
                    className="sponsor-input sponsor-textarea"
                    required
                    value={selection.otherDetails}
                    onChange={(e) => setSelection((c) => ({ ...c, otherDetails: e.target.value }))}
                    placeholder={t("sponsors.create.otherDetailsPlaceholder")}
                  />
                </label>
              ) : null}
              <div className="sponsor-form-actions sponsor-field-span">
                <button className="sponsor-button-primary" disabled={!selectedCard} type="submit">
                  {t("sponsors.create.submit")}
                </button>
              </div>
            </form>
          </div>

          <div className="sponsor-panel">
            <div className="sponsor-panel-header">
              <div>
                <p className="sponsor-section-eyebrow">{t("sponsors.create.availableOptions")}</p>
                <h2 className="sponsor-panel-title">{t("sponsors.create.choose")}</h2>
              </div>
            </div>

            <div className="sponsor-type-tabs">
              <button
                className={`sponsor-type-tab ${selection.type === "PUB" ? "is-selected" : ""}`}
                onClick={() => changeSponsorType("PUB")}
                type="button"
              >
                {t("sponsors.labels.types.PUB")}
              </button>
              <button
                className={`sponsor-type-tab ${selection.type === "TEAM" ? "is-selected" : ""}`}
                onClick={() => changeSponsorType("TEAM")}
                type="button"
              >
                {t("sponsors.create.tabs.teams")}
              </button>
              <button
                className={`sponsor-type-tab ${selection.type === "OTHER" ? "is-selected" : ""}`}
                onClick={() => changeSponsorType("OTHER")}
                type="button"
              >
                {t("sponsors.create.tabs.other")}
              </button>
            </div>

            {isLoading ? (
              <div className="sponsor-empty-card">{t("sponsors.create.loadingOptions")}</div>
            ) : availableOptions.length === 0 ? (
              <div className="sponsor-empty-card">{t("sponsors.create.empty.all")}</div>
            ) : selection.type === "PUB" ? (
              pubCards.length === 0 ? (
                <div className="sponsor-empty-card">{t("sponsors.create.empty.pub")}</div>
              ) : (
                <div className="sponsor-option-grid">
                  {pubCards.map((option) => (
                    <SponsorOptionButton
                      freeLabel={t("sponsors.create.freeAvailable", { count: option.free ?? 0 })}
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
                <div className="sponsor-empty-card">{t("sponsors.create.empty.team")}</div>
              ) : (
                <div className="sponsor-team-picker">
                  <div className="sponsor-team-picker-head">
                    <button className="sponsor-icon-button" onClick={showPreviousTeam} type="button" aria-label={t("sponsors.create.previousTeam")}>
                      <ChevronLeft size={18} />
                    </button>
                    <div>
                      <p className="sponsor-section-eyebrow">{t("sponsors.create.teamCounter", { current: teamIndex + 1, total: teamOptionGroups.length })}</p>
                      <h3>{currentTeamGroup.team.label}</h3>
                    </div>
                    <button className="sponsor-icon-button" onClick={showNextTeam} type="button" aria-label={t("sponsors.create.nextTeam")}>
                      <ChevronRight size={18} />
                    </button>
                  </div>
                  <div className="sponsor-option-grid">
                    {currentTeamGroup.options.map((option) => (
                      <SponsorOptionButton
                        freeLabel={t("sponsors.create.freeAvailable", { count: 0 })}
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
              <div className="sponsor-empty-card">{t("sponsors.create.empty.other")}</div>
            ) : (
              <div className="sponsor-option-grid">
                {otherCards.map((option) => (
                  <SponsorOptionButton
                    freeLabel={t("sponsors.create.freeAvailable", { count: 0 })}
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
  freeLabel,
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
  freeLabel: string;
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
        <p>{option.description}{option.type === "PUB" && option.free != null ? ` - ${freeLabel}` : ""}</p>
      </div>
      <strong>{option.price == null ? "-" : formatCurrency(option.price)}</strong>
    </button>
  );
}
