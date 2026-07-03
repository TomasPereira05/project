import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import FormBox from "../../../shared/components/MessageFormBox";
import { formatCurrency } from "../../../shared/utils";
import { useEventTickets } from "../hooks";

export default function EventTickets() {
  const { t } = useTranslation();
  const params = useParams();
  const eventId = Number(params.eventId);
  const { event, tickets, loading, message, type, activeCount } = useEventTickets(eventId);

  return (
    <main className="events-page">
      <div className="events-container">
        <section className="events-header">
          <div>
            <p className="events-eyebrow">{t("events.tickets.eyebrow")}</p>
            <h1 className="events-title">{event ? event.name : t("events.tickets.title")}</h1>
            {event && <p className="events-desc">{t("events.tickets.sold", { count: activeCount })}</p>}
          </div>
          <Link to="/admin/events" className="events-button-secondary">
            <ArrowLeft size={16} />
            {t("events.tickets.back")}
          </Link>
        </section>

        {message && type && <FormBox type={type} message={message} />}

        {loading ? (
          <p className="events-loading">{t("events.tickets.loading")}</p>
        ) : tickets.length === 0 ? (
          <div className="events-empty-card">{t("events.tickets.empty")}</div>
        ) : (
          <div className="events-table-wrapper">
            <table className="events-table">
              <thead>
                <tr>
                  <th>{t("events.tickets.buyer")}</th>
                  <th>{t("events.fields.email")}</th>
                  <th>{t("events.fields.sectorName")}</th>
                  <th>{t("events.tickets.type")}</th>
                  <th>{t("events.fields.price")}</th>
                  <th>{t("events.fields.status")}</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr key={ticket.ticketId} className={ticket.status === "CANCELLED" ? "is-cancelled" : ""}>
                    <td>{ticket.buyerName}</td>
                    <td>{ticket.buyerEmail}</td>
                    <td>{ticket.sectorName}</td>
                    <td>{t(`events.priceTypes.${ticket.priceType}`)}</td>
                    <td>{formatCurrency(ticket.price)}</td>
                    <td>
                      <span className={`events-badge events-badge-ticket-${ticket.status.toLowerCase()}`}>
                        {t(`events.ticketStatuses.${ticket.status}`)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
