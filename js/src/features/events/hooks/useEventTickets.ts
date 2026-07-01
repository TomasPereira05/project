import { useEffect, useState } from "react";
import { useStatusHandler } from "../../../shared/hooks/useStatusHandler";
import { fetchEvent, fetchEventTickets } from "../api";
import type { EventOutput, EventTicketOutput } from "../types";

export function useEventTickets(eventId: number) {
  const { message, type, handleError } = useStatusHandler();
  const [event, setEvent] = useState<EventOutput | null>(null);
  const [tickets, setTickets] = useState<EventTicketOutput[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    Promise.all([fetchEvent(eventId), fetchEventTickets(eventId)])
      .then(([loadedEvent, loadedTickets]) => {
        if (!ignore) {
          setEvent(loadedEvent);
          setTickets(loadedTickets);
        }
      })
      .catch(handleError)
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [eventId, handleError]);

  const activeCount = tickets.filter((ticket) => ticket.status !== "CANCELLED").length;

  return { event, tickets, loading, message, type, activeCount };
}
