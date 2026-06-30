import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Scanner, type IDetectedBarcode, type IScannerError } from "@yudiel/react-qr-scanner";
import { AlertTriangle, ArrowLeft, CheckCircle2, ScanLine, XCircle } from "lucide-react";
import { useStatusHandler } from "../../../shared/hooks/useStatusHandler";
import FormBox from "../../../shared/components/MessageFormBox";
import { fetchEvent, validateTicket } from "../api";
import { formatLocalTime } from "../utils/datetime";
import type { EventOutput, TicketValidationOutcome, TicketValidationOutput } from "../types";

type Severity = "valid" | "warning" | "danger";

// Cada desfecho mapeia para uma severidade (cor) e um ícone no painel de resultado.
const SEVERITY_BY_OUTCOME: Record<TicketValidationOutcome, Severity> = {
  VALID: "valid",
  ALREADY_USED: "warning",
  WRONG_EVENT: "warning",
  OUTSIDE_WINDOW: "warning",
  CANCELLED: "danger",
  INVALID: "danger",
};

const ICON_BY_SEVERITY = {
  valid: CheckCircle2,
  warning: AlertTriangle,
  danger: XCircle,
} as const;

export default function TicketScanner() {
  const { t } = useTranslation();
  const params = useParams();
  const eventId = Number(params.eventId);
  const { message, type, handleError } = useStatusHandler();

  const [event, setEvent] = useState<EventOutput | null>(null);
  const [result, setResult] = useState<TicketValidationOutput | null>(null);
  const [cameraError, setCameraError] = useState(false);
  const [manualToken, setManualToken] = useState("");
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
    // falha de permissão/arranque da câmara: caímos para a entrada manual
    console.warn("ticket scanner camera error", error);
    setCameraError(true);
  }, []);

  const onManualSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await submitToken(manualToken);
    setManualToken("");
  };

  const severity: Severity | null = result ? SEVERITY_BY_OUTCOME[result.outcome] : null;
  const ResultIcon = severity ? ICON_BY_SEVERITY[severity] : null;
  // pausa a câmara enquanto um resultado está em ecrã (evita re-leitura do mesmo bilhete)
  const paused = result !== null;

  return (
    <main className="events-page">
      <div className="events-container">
        <section className="events-header">
          <div>
            <p className="events-eyebrow">{t("events.scan.eyebrow")}</p>
            <h1 className="events-title">{event ? event.name : t("events.scan.title")}</h1>
            <p className="events-desc">{t("events.scan.description")}</p>
          </div>
          <Link to="/admin/events" className="events-button-secondary">
            <ArrowLeft size={16} />
            {t("events.scan.back")}
          </Link>
        </section>

        {message && type && <FormBox type={type} message={message} />}

        <div className="events-scan-layout">
          <div>
            {cameraError ? (
              <div className="events-scan-camera-error">{t("events.scan.cameraError")}</div>
            ) : (
              <>
                <div className="events-scan-camera">
                  <Scanner
                    onScan={onScan}
                    onError={onScanError}
                    formats={["qr_code"]}
                    paused={paused}
                    constraints={{ facingMode: "environment" }}
                    components={{ finder: true, torch: true }}
                    sound={false}
                  />
                </div>
                <p className="events-scan-hint">{t("events.scan.hint")}</p>
              </>
            )}

            <form className="events-scan-manual" onSubmit={onManualSubmit}>
              <div className="events-scan-manual-field">
                <label className="events-sector-field-label" htmlFor="manual-token">
                  {t("events.scan.manualLabel")}
                </label>
                <input
                  id="manual-token"
                  className="events-input"
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  placeholder={t("events.scan.manualPlaceholder")}
                  autoComplete="off"
                />
              </div>
              <button type="submit" className="events-button-secondary" disabled={!manualToken.trim()}>
                {t("events.scan.manualSubmit")}
              </button>
            </form>
          </div>

          {result && severity && ResultIcon ? (
            <div className={`events-scan-result is-${severity}`}>
              <div className="events-scan-result-head">
                <ResultIcon size={32} />
                <span className="events-scan-result-title">{t(`events.scan.outcomes.${result.outcome}`)}</span>
              </div>

              {result.ticket && (
                <div className="events-scan-details">
                  <div className="events-scan-detail">
                    <span className="events-scan-detail-label">{t("events.tickets.buyer")}</span>
                    <span className="events-scan-detail-value">{result.ticket.buyerName}</span>
                  </div>
                  <div className="events-scan-detail">
                    <span className="events-scan-detail-label">{t("events.fields.sectorName")}</span>
                    <span className="events-scan-detail-value">{result.ticket.sectorName}</span>
                  </div>
                  <div className="events-scan-detail">
                    <span className="events-scan-detail-label">{t("events.tickets.type")}</span>
                    <span className="events-scan-detail-value">
                      {t(`events.priceTypes.${result.ticket.priceType}`)}
                    </span>
                  </div>
                  {result.outcome === "ALREADY_USED" && result.ticket.usedAt && (
                    <div className="events-scan-detail">
                      <span className="events-scan-detail-label">{t("events.scan.usedAtLabel")}</span>
                      <span className="events-scan-detail-value">{formatLocalTime(result.ticket.usedAt)}</span>
                    </div>
                  )}
                </div>
              )}

              <button type="button" className="events-button-primary" onClick={() => setResult(null)}>
                <ScanLine size={16} />
                {t("events.scan.scanNext")}
              </button>
            </div>
          ) : (
            <div className="events-scan-result is-idle">{t("events.scan.idle")}</div>
          )}
        </div>
      </div>
    </main>
  );
}
