import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useStatusHandler } from "../../../shared/hooks/useStatusHandler";
import { createEvent, fetchEvent, updateEvent } from "../api";
import type { EventFormValues, SectorFormValue } from "../types";
import { emptyForm, safeCents, toEventInput, toFormValues } from "../utils";

export function useEventForm(eventId: number | undefined) {
  const navigate = useNavigate();
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
        await createEvent(toEventInput(values));
      } else {
        await updateEvent(eventId, toEventInput(values));
      }
      navigate("/admin/events");
    } catch (error) {
      handleError(error);
    } finally {
      setSubmitting(false);
    }
  };

  const goBack = () => navigate("/admin/events");

  return {
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
  };
}