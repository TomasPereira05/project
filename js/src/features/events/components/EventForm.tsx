import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, Trash2 } from "lucide-react";
import FormBox from "../../../shared/components/MessageFormBox";
import { useEventForm } from "../hooks";

export default function EventForm() {
  const { t } = useTranslation();
  const params = useParams();
  const eventId = params.eventId ? Number(params.eventId) : undefined;
  const {
    isEdit,
    values,
    loading,
    submitting,
    message,
    type,
    setField,
    patchSector,
    addSector,
    removeSector,
    memberNotCheaper,
    submit,
    goBack,
  } = useEventForm(eventId);

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
            <button type="button" className="events-button-secondary" onClick={goBack}>
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
