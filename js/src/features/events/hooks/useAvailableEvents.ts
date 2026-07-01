import { useEffect, useState } from "react";
import { useStatusHandler } from "../../../shared/hooks/useStatusHandler";
import { fetchAvailableEvents } from "../api";
import type { EventOutput } from "../types";

export function useAvailableEvents() {
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

  return { events, loading, message, type };
}
