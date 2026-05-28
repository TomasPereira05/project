import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, Trash2 } from "lucide-react";
import { useStatusHandler } from "../../../shared/hooks/useStatusHandler";
import FormBox from "../../../shared/components/MessageFormBox";
import { centsFromEuroInput, euroInputFromCents } from "../../../shared/utils";
import { createEvent, fetchEvent, updateEvent } from "../api";
import type { EventFormValues, EventOutput, SectorFormValue } from "../types";
import { isoToLisbonInput } from "../utils/datetime";

function emptyForm(): EventFormValues {
  return {
    name: "",
    description: "",
    startsAt: "",
    location: "",
    priceNormal: "",
    priceMember: "",
    sectors: [{ sectorId: null, name: "", capacity: "", occupied: 0 }],
  };
}

function toFormValues(event: EventOutput): EventFormValues {
  return {
    name: event.name,
    description: event.description,
    startsAt: isoToLisbonInput(event.startsAt),
    location: event.location,
    priceNormal: euroInputFromCents(event.priceNormal),
    priceMember: euroInputFromCents(event.priceMember),
    sectors: event.sectors.map((sector) => ({
      sectorId: sector.sectorId,
      name: sector.name,
      capacity: String(sector.capacity),
      occupied: sector.occupied,
    })),
  };
}

function safeCents(value: string): number {
  try {
    return centsFromEuroInput(value);
  } catch {
    return -1;
  }
}

export default function EventForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const params = useParams();
  const eventId = params.eventId ? Number(params.eventId) : undefined;
  const isEdit = eventId !== undefined;

  const { message, type, handleError, clearMessage } = useStatusHandler();
  const [values, setValues] = useState<EventFormValues>(emptyForm());
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (eventId === undefined) {
      return;
    }
    let ignore = false;
    setLoading(true);
    fetchEvent(eventId)
      .then((event) => {
        if (!ignore) setValues(toFormValues(event));
      })
      .catch(handleError)
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [eventId, handleError]);

  const setField = (field: keyof EventFormValues, value: string) =>
    setValues((current) => ({ ...current, [field]: value }));

  const patchSector = (index: number, patch: Partial<SectorFormValue>) =>
    setValues((current) => ({
      ...current,
      sectors: current.sectors.map((sector, i) => (i === index ? { ...sector, ...patch } : sector)),
    }));

  const addSector = () =>
    setValues((current) => ({
      ...current,
      sectors: [...current.sectors, { sectorId: null, name: "", capacity: "", occupied: 0 }],
    }));

  const removeSector = (index: number) =>
    setValues((current) => ({
      ...current,
      sectors: current.sectors.filter((_, i) => i !== index),
    }));

  const memberNotCheaper = useMemo(() => {
    const normal = safeCents(values.priceNormal);
    const member = safeCents(values.priceMember);
    return normal > 0 && member >= 0 && member >= normal;
  }, [values.priceNormal, values.priceMember]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    clearMessage();
    setSubmitting(true);
    try {
      if (eventId === undefined) {
        await createEvent(values);
      } else {
        await updateEvent(eventId, values);
      }
      navigate("/admin/events");
    } catch (error) {
      handleError(error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="events-page">
        <div className="events-container">
          <p className="events-loading">{t("events.form.loading")}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="events-page">
      <div className="events-container">
        <section className="events-header">
          <div>
            <p className="events-eyebrow">{t("events.form.eyebrow")}</p>
            <h1 className="events-title">{isEdit ? t("events.form.editTitle") : t("events.form.createTitle")}</h1>
          </div>
        </section>

        {message && type && <FormBox type={type} message={message} />}

        <form className="events-form" onSubmit={submit}>
          <div className="events-form-grid">
            <label className="labeled-field">
              <span className="labeled-field-label">{t("events.fields.name")}</span>
              <input className="events-input" value={values.name} onChange={(e) => setField("name", e.target.value)} required />
            </label>
            <label className="labeled-field">
              <span className="labeled-field-label">{t("events.fields.startsAt")}</span>
              <input
                className="events-input"
                type="datetime-local"
                value={values.startsAt}
                onChange={(e) => setField("startsAt", e.target.value)}
                required
              />
            </label>
            <label className="labeled-field">
              <span className="labeled-field-label">{t("events.fields.location")}</span>
              <input className="events-input" value={values.location} onChange={(e) => setField("location", e.target.value)} required />
            </label>
            <label className="labeled-field">
              <span className="labeled-field-label">{t("events.fields.priceNormal")}</span>
              <input
                className="events-input"
                inputMode="decimal"
                value={values.priceNormal}
                onChange={(e) => setField("priceNormal", e.target.value)}
                required
              />
            </label>
            <label className="labeled-field">
              <span className="labeled-field-label">{t("events.fields.priceMember")}</span>
              <input
                className="events-input"
                inputMode="decimal"
                value={values.priceMember}
                onChange={(e) => setField("priceMember", e.target.value)}
                required
              />
            </label>
            <label className="labeled-field events-field-full">
              <span className="labeled-field-label">{t("events.fields.description")}</span>
              <textarea
                className="events-input events-textarea"
                rows={3}
                value={values.description}
                onChange={(e) => setField("description", e.target.value)}
              />
            </label>
          </div>

          {memberNotCheaper && <FormBox type="info" message={t("events.form.equalPriceWarning")} />}
          {isEdit && <FormBox type="info" message={t("events.form.priceSnapshotNote")} />}

          <div className="events-sectors">
            <div className="events-sectors-head">
              <h2 className="events-sectors-title">{t("events.form.sectors")}</h2>
              <button type="button" className="events-button-secondary" onClick={addSector}>
                <Plus size={16} />
                {t("events.form.addSector")}
              </button>
            </div>

            <div className="events-sector-list">
              {values.sectors.map((sector, index) => {
                const hasSales = sector.occupied > 0;
                const capacityNumber = Number.parseInt(sector.capacity, 10) || 0;
                return (
                  <div className="events-sector-row" key={sector.sectorId ?? `new-${index}`}>
                    <div className="events-sector-field">
                      <span className="events-sector-field-label">{t("events.fields.sectorName")}</span>
                      <input
                        className="events-input"
                        value={sector.name}
                        onChange={(e) => patchSector(index, { name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="events-sector-field">
                      <span className="events-sector-field-label">{t("events.fields.capacity")}</span>
                      <input
                        className="events-input"
                        type="number"
                        min={sector.occupied || 0}
                        value={sector.capacity}
                        onChange={(e) => patchSector(index, { capacity: e.target.value })}
                        required
                      />
                    </div>
                    <p className="events-sector-occupancy">
                      {sector.sectorId != null
                        ? t("events.form.occupancyValue", {
                            occupied: sector.occupied,
                            capacity: capacityNumber,
                            available: Math.max(0, capacityNumber - sector.occupied),
                          })
                        : "—"}
                    </p>
                    <div className="events-sector-remove">
                      <button
                        type="button"
                        className="events-button-ghost-danger"
                        onClick={() => removeSector(index)}
                        disabled={hasSales}
                        title={hasSales ? t("events.form.removeBlocked") : t("events.form.removeSector")}
                        aria-label={t("events.form.removeSector")}
                      >
                        <Trash2 size={16} />
                        {t("events.form.removeSector")}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="events-form-actions">
            <button type="button" className="events-button-secondary" onClick={() => navigate("/admin/events")}>
              {t("events.form.back")}
            </button>
            <button type="submit" className="events-button-primary" disabled={submitting}>
              {submitting ? t("events.form.saving") : t("events.form.submit")}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
