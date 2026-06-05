import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { CalendarClock, EyeOff, Plus, RotateCcw, Save, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { fetchAllTeamCategories, type TeamCatalogCategory } from "../../Athletes";
import {
  createTrainingSchedule,
  deactivateTrainingSchedule,
  fetchTrainingSchedules,
  reactivateTrainingSchedule,
  updateTrainingSchedule,
  type TrainingSchedule,
  type TrainingScheduleInput,
} from "../api";
import { dayKeys, TrainingScheduleBoard, weekdays } from "./TrainingScheduleBoard";

const currentSeason = "2025/2026";
const emptyDraft: TrainingScheduleInput = {
  teamCategoryId: 0,
  season: currentSeason,
  weekday: 1,
  startTime: "18:00",
  endTime: "19:30",
  fieldName: "Campo Principal",
  fieldZone: "",
  active: true,
  notes: "",
};

export default function TrainingSchedules() {
  const { t } = useTranslation();
  const [schedules, setSchedules] = useState<TrainingSchedule[]>([]);
  const [categories, setCategories] = useState<TeamCatalogCategory[]>([]);
  const [season, setSeason] = useState(currentSeason);
  const [showInactive, setShowInactive] = useState(false);
  const [draft, setDraft] = useState<TrainingScheduleInput>(emptyDraft);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function loadSchedules() {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const [scheduleResponse, categoryResponse] = await Promise.all([
        fetchTrainingSchedules({ season, activeOnly: !showInactive }),
        fetchAllTeamCategories(),
      ]);
      setSchedules(scheduleResponse);
      setCategories(categoryResponse.filter((category) => category.active));
    } catch {
      setErrorMessage(t("admin.training.errors.load"));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadSchedules();
  }, [season, showInactive]);

  useEffect(() => {
    setDraft((current) => ({
      ...current,
      season,
      teamCategoryId: current.teamCategoryId || categories[0]?.teamId || 0,
    }));
  }, [categories, season]);

  const sortedCategories = useMemo(
    () => [...categories].sort((left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0) || left.label.localeCompare(right.label)),
    [categories],
  );

  function dayLabel(weekday: number) {
    return t(`admin.training.weekdays.${dayKeys[weekday - 1]}`);
  }

  function selectSchedule(schedule: TrainingSchedule) {
    setEditingId(schedule.trainingScheduleId);
    setDraft({
      trainingScheduleId: schedule.trainingScheduleId,
      teamCategoryId: schedule.teamCategoryId,
      season: schedule.season,
      weekday: schedule.weekday,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      fieldName: schedule.fieldName,
      fieldZone: schedule.fieldZone ?? "",
      active: schedule.active,
      notes: schedule.notes ?? "",
    });
    setFeedback("");
    setErrorMessage("");
  }

  function resetForm() {
    setEditingId(null);
    setDraft({
      ...emptyDraft,
      season,
      teamCategoryId: sortedCategories[0]?.teamId ?? 0,
    });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    setFeedback("");
    setErrorMessage("");

    try {
      const payload = {
        ...draft,
        fieldZone: draft.fieldZone?.trim() || null,
        notes: draft.notes?.trim() || null,
      };

      if (editingId) {
        await updateTrainingSchedule(editingId, payload);
        setFeedback(t("admin.training.feedback.updated"));
      } else {
        await createTrainingSchedule(payload);
        setFeedback(t("admin.training.feedback.created"));
      }
      resetForm();
      await loadSchedules();
    } catch {
      setErrorMessage(t("admin.training.errors.save"));
    } finally {
      setIsSaving(false);
    }
  }

  async function toggleActive(schedule: TrainingSchedule) {
    setFeedback("");
    setErrorMessage("");

    try {
      if (schedule.active) {
        await deactivateTrainingSchedule(schedule.trainingScheduleId);
        setFeedback(t("admin.training.feedback.deactivated"));
      } else {
        await reactivateTrainingSchedule(schedule.trainingScheduleId);
        setFeedback(t("admin.training.feedback.reactivated"));
      }
      await loadSchedules();
      resetForm();
    } catch {
      setErrorMessage(t("admin.training.errors.toggle"));
    }
  }

  const selectedSchedule = editingId ? schedules.find((schedule) => schedule.trainingScheduleId === editingId) : null;

  return (
    <main className="admin-training-page">
      <section className="admin-home-header">
        <p className="admin-eyebrow">{t("admin.training.eyebrow")}</p>
        <h1>{t("admin.training.title")}</h1>
        <p>{t("admin.training.description")}</p>
      </section>

      {feedback ? <div className="sponsor-feedback sponsor-feedback-success">{feedback}</div> : null}
      {errorMessage ? <div className="sponsor-feedback sponsor-feedback-error">{errorMessage}</div> : null}

      <section className="admin-training-toolbar">
        <label>
          <span>{t("admin.training.filters.season")}</span>
          <input value={season} onChange={(event) => setSeason(event.target.value)} />
        </label>
        <label className="admin-training-toggle">
          <input checked={showInactive} onChange={(event) => setShowInactive(event.target.checked)} type="checkbox" />
          <span>{t("admin.training.filters.showInactive")}</span>
        </label>
      </section>

      <section className="admin-training-layout">
        <div className="admin-training-board-panel">
          <div className="admin-section-header">
            <div>
              <p className="admin-eyebrow">{t("admin.training.board.eyebrow")}</p>
              <h2>{t("admin.training.board.title")}</h2>
            </div>
            <span className="admin-training-count">
              <CalendarClock size={16} />
              {isLoading ? "-" : schedules.length}
            </span>
          </div>
          {isLoading ? (
            <div className="sponsor-empty-card">{t("admin.training.loading")}</div>
          ) : schedules.length === 0 ? (
            <div className="sponsor-empty-card">{t("admin.training.empty")}</div>
          ) : (
            <TrainingScheduleBoard schedules={schedules} dayLabel={dayLabel} onSelect={selectSchedule} />
          )}
        </div>

        <aside className="admin-training-form-panel">
          <div className="admin-section-header">
            <div>
              <p className="admin-eyebrow">{editingId ? t("admin.training.form.editEyebrow") : t("admin.training.form.createEyebrow")}</p>
              <h2>{editingId ? t("admin.training.form.editTitle") : t("admin.training.form.createTitle")}</h2>
            </div>
          </div>

          <form className="admin-training-form" onSubmit={handleSubmit}>
            <label>
              <span>{t("admin.training.form.team")}</span>
              <select value={draft.teamCategoryId} onChange={(event) => setDraft((current) => ({ ...current, teamCategoryId: Number(event.target.value) }))} required>
                {sortedCategories.map((category) => (
                  <option key={category.teamId} value={category.teamId}>
                    {category.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>{t("admin.training.form.weekday")}</span>
              <select value={draft.weekday} onChange={(event) => setDraft((current) => ({ ...current, weekday: Number(event.target.value) }))}>
                {weekdays.map((weekday) => (
                  <option key={weekday} value={weekday}>
                    {dayLabel(weekday)}
                  </option>
                ))}
              </select>
            </label>

            <div className="admin-training-form-row">
              <label>
                <span>{t("admin.training.form.startTime")}</span>
                <input value={draft.startTime} onChange={(event) => setDraft((current) => ({ ...current, startTime: event.target.value }))} type="time" required />
              </label>
              <label>
                <span>{t("admin.training.form.endTime")}</span>
                <input value={draft.endTime} onChange={(event) => setDraft((current) => ({ ...current, endTime: event.target.value }))} type="time" required />
              </label>
            </div>

            <label>
              <span>{t("admin.training.form.fieldName")}</span>
              <input value={draft.fieldName} onChange={(event) => setDraft((current) => ({ ...current, fieldName: event.target.value }))} required />
            </label>

            <label>
              <span>{t("admin.training.form.fieldZone")}</span>
              <input value={draft.fieldZone ?? ""} onChange={(event) => setDraft((current) => ({ ...current, fieldZone: event.target.value }))} />
            </label>

            <label>
              <span>{t("admin.training.form.notes")}</span>
              <textarea value={draft.notes ?? ""} onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))} rows={3} />
            </label>

            <div className="admin-training-form-actions">
              <button className="member-btn-primary-sm" disabled={isSaving || draft.teamCategoryId === 0} type="submit">
                {editingId ? <Save size={18} /> : <Plus size={18} />}
                {isSaving ? t("admin.training.form.saving") : editingId ? t("admin.training.form.save") : t("admin.training.form.create")}
              </button>
              {editingId ? (
                <>
                  <button className="member-icon-btn" onClick={resetForm} type="button">
                    <X size={18} />
                  </button>
                  {selectedSchedule ? (
                    <button className="member-icon-btn" onClick={() => void toggleActive(selectedSchedule)} type="button">
                      {selectedSchedule.active ? <EyeOff size={18} /> : <RotateCcw size={18} />}
                    </button>
                  ) : null}
                </>
              ) : null}
            </div>
          </form>
        </aside>
      </section>
    </main>
  );
}
