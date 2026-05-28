import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CalendarDays, MapPin, Ticket } from "lucide-react";
import Header from "../../../shared/components/Header";
import Footer from "../../../shared/components/Footer";
import { useStatusHandler } from "../../../shared/hooks/useStatusHandler";
import FormBox from "../../../shared/components/MessageFormBox";
import { formatCurrency } from "../../../shared/utils";
import { fetchAvailableEvents } from "../api";
import type { EventOutput } from "../types";
import { formatEventDateTime } from "../utils/datetime";

export default function EventsPublicList() {
  const { t } = useTranslation();
  const [events, setEvents] = useState<EventOutput[]>([]);
  const [loading, setLoading] = useState(true);
  const { message, type, handleError } = useStatusHandler();

  useEffect(() => {
    let ignore = false;
    fetchAvailableEvents()
      .then((list) => {
        if (!ignore) setEvents(list);
      })
      .catch(handleError)
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [handleError]);

  return (
    <div>
      <Header />
      <main className="events-public">
        <section className="events-public-header">
          <p className="events-eyebrow">{t("events.public.eyebrow")}</p>
          <h1 className="events-title">{t("events.public.title")}</h1>
          <p className="events-desc">{t("events.public.description")}</p>
        </section>

        {message && type && <FormBox type={type} message={message} />}

        {loading ? (
          <p className="events-loading">{t("events.public.loading")}</p>
        ) : events.length === 0 ? (
          <div className="events-public-empty">
            <Ticket className="events-public-empty-icon" size={48} strokeWidth={1.5} />
            <p className="events-public-empty-text">{t("events.public.empty")}</p>
          </div>
        ) : (
          <div className="events-public-grid">
            {events.map((event) => {
              const available = event.sectors.reduce((sum, sector) => sum + sector.available, 0);
              return (
                <article key={event.eventId} className="events-public-card">
                  <header className="events-public-card-header">
                    <h2 className="events-public-card-title">{event.name}</h2>
                    <p className="events-public-card-date">
                      <CalendarDays size={14} />
                      {formatEventDateTime(event.startsAt)}
                    </p>
                  </header>

                  <div className="events-public-card-body">
                    <p className="events-public-meta">
                      <MapPin size={16} />
                      {event.location}
                    </p>

                    <div className="events-public-prices">
                      <span className="events-price-pill">
                        <span className="events-price-pill-label">{t("events.public.normalPrice")}</span>
                        <span className="events-price-pill-value">{formatCurrency(event.priceNormal)}</span>
                      </span>
                      <span className="events-price-pill events-price-pill-member">
                        <span className="events-price-pill-label">{t("events.public.memberPrice")}</span>
                        <span className="events-price-pill-value">{formatCurrency(event.priceMember)}</span>
                      </span>
                    </div>

                    <p className="events-public-available">{t("events.public.availableSeats", { count: available })}</p>

                    <Link to={`/tickets/${event.eventId}`} className="events-button-primary events-public-cta">
                      <Ticket size={16} />
                      {t("events.public.buy")}
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
