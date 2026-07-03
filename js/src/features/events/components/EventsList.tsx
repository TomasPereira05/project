import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import FormBox from "../../../shared/components/MessageFormBox";
import type { EventStatusFilter } from "../types";
import { formatEventDateTime } from "../utils/datetime";
import { useEventsList } from "../hooks";

const FILTERS: EventStatusFilter[] = ["scheduled", "past", "cancelled", "all"];

export default function EventsList() {
  const { t } = useTranslation();
  const { filter, setFilter, events, loading, message, type, cancel } = useEventsList(t);

  return (
    <main className="events-page">
      <div className="events-container">
        <section className="events-header">
          <div>
            <p className="events-eyebrow">{t("events.list.eyebrow")}</p>
            <h1 className="events-title">{t("events.list.title")}</h1>
            <p className="events-desc">{t("events.list.description")}</p>
          </div>
          <Link to="/admin/events/new" className="events-button-primary">
            <Plus size={16} />
            {t("events.list.new")}
          </Link>
        </section>

        {message && type && <FormBox type={type} message={message} />}

        <div className="events-tabs">
          {FILTERS.map((value) => (
            <button
              key={value}
              type="button"
              className={`events-tab ${filter === value ? "is-active" : ""}`}
              onClick={() => setFilter(value)}
            >
              {t(`events.filters.${value}`)}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="events-loading">{t("events.list.loading")}</p>
        ) : events.length === 0 ? (
          <div className="events-empty-card">{t("events.list.empty")}</div>
        ) : (
          <div className="events-table-wrapper">
            <table className="events-table">
              <thead>
                <tr>
                  <th>{t("events.fields.name")}</th>
                  <th>{t("events.fields.startsAt")}</th>
                  <th>{t("events.fields.location")}</th>
                  <th>{t("events.fields.capacity")}</th>
                  <th>{t("events.fields.status")}</th>
                  <th>{t("events.fields.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => {
                  const occupied = event.sectors.reduce((sum, sector) => sum + sector.occupied, 0);
                  return (
                    <tr key={event.eventId} className={event.status === "CANCELLED" ? "is-cancelled" : ""}>
                      <td>{event.name}</td>
                      <td>{formatEventDateTime(event.startsAt)}</td>
                      <td>{event.location}</td>
                      <td>
                        {occupied}/{event.capacityTotal}
                      </td>
                      <td>
                        <span className={`events-badge events-badge-${event.status.toLowerCase()}`}>
                          {t(`events.statuses.${event.status}`)}
                        </span>
                      </td>
                      <td>
                        <div className="events-row-actions">
                          <Link to={`/admin/events/${event.eventId}/tickets`} className="events-action-btn">
                            {t("events.list.tickets")}
                          </Link>
                          {event.status !== "CANCELLED" && (
                            <>
                              <Link to={`/admin/events/${event.eventId}/scan`} className="events-action-btn">
                                {t("events.list.scan")}
                              </Link>
                              <Link to={`/admin/events/${event.eventId}/edit`} className="events-action-btn">
                                {t("events.list.edit")}
                              </Link>
                              <button
                                type="button"
                                className="events-action-btn-danger"
                                onClick={() => cancel(event)}
                              >
                                {t("events.list.cancel")}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
