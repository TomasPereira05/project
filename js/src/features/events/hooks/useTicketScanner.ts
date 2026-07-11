import { useCallback, useEffect, useRef, useState } from "react";
import type { IDetectedBarcode, IScannerError } from "@yudiel/react-qr-scanner";
import { useStatusHandler } from "../../../shared/hooks/useStatusHandler";
import { fetchEvent, validateTicket } from "../api";
import type { EventOutput, TicketValidationOutput } from "../types";

export function useTicketScanner(eventId: number) {
  const { message, type, handleError } = useStatusHandler();

  const [event, setEvent] = useState<EventOutput | null>(null);
  const [result, setResult] = useState<TicketValidationOutput | null>(null);
  const [cameraError, setCameraError] = useState(false);
  // evita pedidos concorrentes (a câmara dispara onScan em rajada)
  const processingRef = useRef(false);

  useEffect(() => {
    let ignore = false;
    fetchEvent(eventId)
      .then((loaded) => {
        if (!ignore) setEvent(loaded);
      })
      .catch(handleError);
    return () => {
      ignore = true;
    };
  }, [eventId, handleError]);

  const submitToken = useCallback(
    async (token: string) => {
      const cleaned = token.trim();
      if (!cleaned || processingRef.current) return;
      processingRef.current = true;
      try {
        setResult(await validateTicket(eventId, cleaned));
      } catch (error) {
        handleError(error);
      } finally {
        processingRef.current = false;
      }
    },
    [eventId, handleError],
  );

  const onScan = useCallback(
    (codes: IDetectedBarcode[]) => {
      const raw = codes[0]?.rawValue;
      if (raw) void submitToken(raw);
    },
    [submitToken],
  );

  const onScanError = useCallback((error: IScannerError) => {
    console.warn("ticket scanner camera error", error);
    setCameraError(true);
  }, []);

  const clearResult = () => setResult(null);
  // pausa a câmara enquanto um resultado está em ecrã (evita re-leitura do mesmo bilhete)
  const paused = result !== null;

  return {
    event,
    result,
    cameraError,
    message,
    type,
    onScan,
    onScanError,
    clearResult,
    paused,
  };
}
