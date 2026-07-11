import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Scanner } from "@yudiel/react-qr-scanner";
import { AlertTriangle, ArrowLeft, CheckCircle2, ScanLine, XCircle } from "lucide-react";
import FormBox from "../../../shared/components/MessageFormBox";
import { formatLocalTime } from "../utils/datetime";
import type { TicketValidationOutcome } from "../types";
import { useTicketScanner } from "../hooks";

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
  const {
    event,
    result,
    cameraError,
    message,
    type,
    onScan,
    onScanError,
    clearResult,
    paused,
  } = useTicketScanner(eventId);

  const severity: Severity | null = result ? SEVERITY_BY_OUTCOME[result.outcome] : null;
  const ResultIcon = severity ? ICON_BY_SEVERITY[severity] : null;

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

              <button type="button" className="events-button-primary" onClick={clearResult}>
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
