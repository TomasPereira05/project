import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { CheckCircle2, Pencil, Plus, Save, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { activateSeason, createSeason, fetchSeasons, updateSeason, type Season, type SeasonInput } from "../api";

const emptyDraft: SeasonInput = {
  name: "",
  startsAt: "",
  endsAt: "",
  active: false,
};

export default function SeasonSettings() {
  const { t } = useTranslation();
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [draft, setDraft] = useState<SeasonInput>(emptyDraft);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function loadSeasons() {
    setIsLoading(true);
    setErrorMessage("");

    try {
      setSeasons(await fetchSeasons());
    } catch {
      setErrorMessage(t("admin.seasons.errors.load"));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadSeasons();
  }, []);

  const sortedSeasons = useMemo(
    () => [...seasons].sort((left, right) => right.name.localeCompare(left.name)),
    [seasons],
  );

  function selectSeason(season: Season) {
    setEditingId(season.seasonId);
    setDraft({
      seasonId: season.seasonId,
      name: season.name,
      startsAt: season.startsAt,
      endsAt: season.endsAt,
      active: season.active,
    });
    setFeedback("");
    setErrorMessage("");
  }

  function resetForm() {
    setEditingId(null);
    setDraft(emptyDraft);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    setFeedback("");
    setErrorMessage("");

    try {
      const payload = {
        ...draft,
        name: draft.name.trim(),
      };

      if (editingId) {
        await updateSeason(editingId, payload);
        setFeedback(t("admin.seasons.feedback.updated"));
      } else {
        await createSeason(payload);
        setFeedback(t("admin.seasons.feedback.created"));
      }

      resetForm();
      await loadSeasons();
    } catch {
      setErrorMessage(t("admin.seasons.errors.save"));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleActivate(seasonId: number) {
    setFeedback("");
    setErrorMessage("");

    try {
      await activateSeason(seasonId);
      setFeedback(t("admin.seasons.feedback.activated"));
      await loadSeasons();
    } catch {
      setErrorMessage(t("admin.seasons.errors.activate"));
    }
  }

  return (
    <main className="admin-training-page">
      <section className="admin-home-header">
        <p className="admin-eyebrow">{t("admin.seasons.eyebrow")}</p>
        <h1>{t("admin.seasons.title")}</h1>
        <p>{t("admin.seasons.description")}</p>
      </section>

      {feedback ? <div className="sponsor-feedback sponsor-feedback-success">{feedback}</div> : null}
      {errorMessage ? <div className="sponsor-feedback sponsor-feedback-error">{errorMessage}</div> : null}

      <section className="admin-training-layout">
        <div className="admin-training-board-panel">
          <div className="admin-section-header">
            <div>
              <p className="admin-eyebrow">{t("admin.seasons.list.eyebrow")}</p>
              <h2>{t("admin.seasons.list.title")}</h2>
            </div>
          </div>

          {isLoading ? (
            <div className="sponsor-empty-card">{t("admin.seasons.loading")}</div>
          ) : sortedSeasons.length === 0 ? (
            <div className="sponsor-empty-card">{t("admin.seasons.empty")}</div>
          ) : (
            <div className="admin-users-table-wrap">
              <table className="admin-users-table admin-seasons-table">
                <thead>
                  <tr>
                    <th>{t("admin.seasons.table.name")}</th>
                    <th>{t("admin.seasons.table.period")}</th>
                    <th>{t("admin.seasons.table.status")}</th>
                    <th>{t("admin.seasons.table.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedSeasons.map((season) => (
                    <tr key={season.seasonId}>
                      <td><strong>{season.name}</strong></td>
                      <td>{season.startsAt} - {season.endsAt}</td>
                      <td>
                        <span className={season.active ? "admin-season-status-active" : "admin-season-status"}>
                          {season.active ? t("admin.seasons.status.active") : t("admin.seasons.status.inactive")}
                        </span>
                      </td>
                      <td>
                        <div className="admin-season-actions">
                          <button className="member-icon-btn" onClick={() => selectSeason(season)} type="button" title={t("admin.seasons.actions.edit")}>
                            <Pencil size={18} />
                          </button>
                          {!season.active ? (
                            <button className="member-icon-btn" onClick={() => void handleActivate(season.seasonId)} type="button" title={t("admin.seasons.actions.activate")}>
                              <CheckCircle2 size={18} />
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <aside className="admin-training-form-panel">
          <div className="admin-section-header">
            <div>
              <p className="admin-eyebrow">{editingId ? t("admin.seasons.form.editEyebrow") : t("admin.seasons.form.createEyebrow")}</p>
              <h2>{editingId ? t("admin.seasons.form.editTitle") : t("admin.seasons.form.createTitle")}</h2>
            </div>
          </div>

          <form className="admin-training-form" onSubmit={handleSubmit}>
            <label>
              <span>{t("admin.seasons.form.name")}</span>
              <input value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} placeholder="2025/2026" required />
            </label>

            <label>
              <span>{t("admin.seasons.form.startsAt")}</span>
              <input value={draft.startsAt} onChange={(event) => setDraft((current) => ({ ...current, startsAt: event.target.value }))} type="date" required />
            </label>

            <label>
              <span>{t("admin.seasons.form.endsAt")}</span>
              <input value={draft.endsAt} onChange={(event) => setDraft((current) => ({ ...current, endsAt: event.target.value }))} type="date" required />
            </label>

            <div className="admin-training-form-actions">
              <button className="member-btn-primary-sm" disabled={isSaving} type="submit">
                {editingId ? <Save size={18} /> : <Plus size={18} />}
                {isSaving ? t("admin.seasons.form.saving") : editingId ? t("admin.seasons.form.save") : t("admin.seasons.form.create")}
              </button>
              {editingId ? (
                <button className="member-icon-btn" onClick={resetForm} type="button">
                  <X size={18} />
                </button>
              ) : null}
            </div>
          </form>
        </aside>
      </section>
    </main>
  );
}
