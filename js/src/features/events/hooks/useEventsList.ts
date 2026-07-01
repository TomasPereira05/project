import { useCallback, useEffect, useState } from "react";
import type { TFunction } from "i18next";
import { useStatusHandler } from "../../../shared/hooks/useStatusHandler";
import { cancelEvent, fetchEvents } from "../api";
import type { EventOutput, EventStatusFilter } from "../types";

export function useEventsList(t: TFunction<"translation", undefined>) {
  const [filter, setFilter] = useState<EventStatusFilter>("scheduled");
  const [events, setEvents] = useState<EventOutput[]>([]);
  const [loading, setLoading] = useState(true);
  const { message, type, setSuccess, handleError } = useStatusHandler();

  const reload = useCallback(() => {
    setLoading(true);
    fetchEvents(filter)
      .then(setEvents)
      .catch(handleError)
      .finally(() => setLoading(false));
  }, [filter, handleError]);

  useEffect(() => {
    reload();
  }, [reload]);

  const cancel = async (event: EventOutput) => {
    if (!window.confirm(t("events.list.confirmCancel", { name: event.name }))) {
      return;
    }
    try {
      await cancelEvent(event.eventId);
      setSuccess(t("events.list.cancelled"));
      reload();
    } catch (error) {
      handleError(error);
    }
  };

  return { filter, setFilter, events, loading, message, type, cancel };
}
