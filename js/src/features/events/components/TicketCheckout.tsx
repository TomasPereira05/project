import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ArrowRight, CreditCard, Minus, Plus } from "lucide-react";
import Header from "../../../shared/components/Header";
import Footer from "../../../shared/components/Footer";
import { useAuth } from "../../../shared/hooks/useAuth";
import { useStatusHandler } from "../../../shared/hooks/useStatusHandler";
import FormBox from "../../../shared/components/MessageFormBox";
import { formatCurrency } from "../../../shared/utils";
import { fetchEvent, startTicketCheckout, validateMemberCredential } from "../api";
import type { EventOutput, TicketLineInput, TicketPriceType } from "../types";
import { formatEventDateTime } from "../utils/datetime";

const MAX_TICKETS = 5;
const STEP_KEYS = ["tickets", "sectors", "buyer", "payment"] as const;

type WizardTicket = {
  priceType: TicketPriceType;
  sectorId: number | null;
  // sócio autenticado a usar a própria conta (desconto automático, sem credenciais)
  useAccount: boolean;
  memberNumber: string;
  memberBirthDate: string; // yyyy-MM-dd
};

function newTicket(priceType: TicketPriceType, useAccount: boolean): WizardTicket {
  return { priceType, sectorId: null, useAccount, memberNumber: "", memberBirthDate: "" };
}

export default function TicketCheckout() {
  const { t } = useTranslation();
  const { eventId: eventIdParam } = useParams();
  const eventId = Number(eventIdParam);
  const { activeMemberId, email } = useAuth();
  const canUseAccount = Boolean(activeMemberId);

  const { message, type, handleError, clearMessage, setError } = useStatusHandler();
  const [event, setEvent] = useState<EventOutput | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [tickets, setTickets] = useState<WizardTicket[]>([]);
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState(email ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    let ignore = false;
    fetchEvent(eventId)
      .then((loaded) => {
        if (!ignore) setEvent(loaded);
      })
      .catch(handleError)
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [eventId, handleError]);

  useEffect(() => {
    if (email && !buyerEmail) setBuyerEmail(email);
  }, [email, buyerEmail]);

  const normalCount = tickets.filter((tk) => tk.priceType === "NORMAL").length;
  const memberCount = tickets.filter((tk) => tk.priceType === "MEMBER").length;
  const accountUsed = tickets.some((tk) => tk.priceType === "MEMBER" && tk.useAccount);

  const priceOf = (tk: WizardTicket) => (tk.priceType === "MEMBER" ? event?.priceMember ?? 0 : event?.priceNormal ?? 0);
  const total = useMemo(() => tickets.reduce((sum, tk) => sum + priceOf(tk), 0), [tickets, event]);

  const addTicket = (priceType: TicketPriceType) => {
    if (tickets.length >= MAX_TICKETS) return;
    const useAccount = priceType === "MEMBER" && canUseAccount && !accountUsed;
    setTickets((current) => [...current, newTicket(priceType, useAccount)]);
  };

  const removeTicket = (priceType: TicketPriceType) => {
    setTickets((current) => {
      const index = [...current].reverse().findIndex((tk) => tk.priceType === priceType);
      if (index === -1) return current;
      const realIndex = current.length - 1 - index;
      return current.filter((_, i) => i !== realIndex);
    });
  };

  const patchTicket = (index: number, patch: Partial<WizardTicket>) =>
    setTickets((current) => current.map((tk, i) => (i === index ? { ...tk, ...patch } : tk)));

  // alocação por setor (guard simples anti-overselling no cliente; o backend é a autoridade)
  const sectorAllocation = useMemo(() => {
    const map = new Map<number, number>();
    tickets.forEach((tk) => {
      if (tk.sectorId != null) map.set(tk.sectorId, (map.get(tk.sectorId) ?? 0) + 1);
    });
    return map;
  }, [tickets]);

  const sectorsValid =
    event != null &&
    tickets.every((tk) => tk.sectorId != null) &&
    event.sectors.every((sector) => (sectorAllocation.get(sector.sectorId) ?? 0) <= sector.available);

  const ticketsStepValid =
    tickets.length >= 1 &&
    tickets.length <= MAX_TICKETS &&
    tickets.every(
      (tk) => tk.priceType === "NORMAL" || tk.useAccount || (/^\d+$/.test(tk.memberNumber.trim()) && tk.memberBirthDate !== ""),
    );

  const buyerValid = buyerName.trim() !== "" && /\S+@\S+\.\S+/.test(buyerEmail);

  const canAdvance = step === 0 ? ticketsStepValid : step === 1 ? sectorsValid : step === 2 ? buyerValid : true;

  const submit = async () => {
    if (!event) return;
    clearMessage();
    setSubmitting(true);
    try {
      const lines: TicketLineInput[] = tickets.map((tk) => {
        if (tk.priceType === "NORMAL" || tk.useAccount) {
          return { sectorId: tk.sectorId as number, priceType: tk.priceType };
        }
        return {
          sectorId: tk.sectorId as number,
          priceType: "MEMBER",
          memberNumber: Number(tk.memberNumber),
          memberBirthDate: tk.memberBirthDate,
        };
      });
      const session = await startTicketCheckout(eventId, { buyerName: buyerName.trim(), buyerEmail: buyerEmail.trim(), lines });
      window.location.assign(session.checkoutUrl);
    } catch (error) {
      handleError(error);
      setSubmitting(false);
    }
  };

  // Avança de passo; no passo dos bilhetes valida no servidor as credenciais de sócio
  // (nº + data de nascimento) antes de deixar escolher setores.
  const goNext = async () => {
    if (step === 0) {
      const credTickets = tickets.filter((tk) => tk.priceType === "MEMBER" && !tk.useAccount);
      if (credTickets.length > 0) {
        clearMessage();
        setValidating(true);
        try {
          const results = await Promise.all(
            credTickets.map((tk) => validateMemberCredential(Number(tk.memberNumber), tk.memberBirthDate)),
          );
          if (results.some((r) => !r.valid)) {
            setError(t("events.checkout.invalidCredentials"));
            return;
          }
        } catch (error) {
          handleError(error);
          return;
        } finally {
          setValidating(false);
        }
      }
    }
    setStep((s) => s + 1);
  };

  let memberSlot = 0; // índice do bilhete de sócio, para o título "Bilhete de sócio N"

  return (
    <div>
      <Header />
      <main className="events-public events-wizard">
        {loading ? (
          <p className="events-loading">{t("events.checkout.loading")}</p>
        ) : !event ? (
          <div className="events-empty-card">{t("events.checkout.notFound")}</div>
        ) : (
          <>
            <section className="events-public-header">
              <p className="events-eyebrow">{t("events.public.eyebrow")}</p>
              <h1 className="events-title">{event.name}</h1>
              <p className="events-desc">
                {formatEventDateTime(event.startsAt)} · {event.location}
              </p>
            </section>

            <ol className="events-wizard-steps">
              {STEP_KEYS.map((key, index) => (
                <li
                  key={key}
                  className={`events-wizard-step ${index === step ? "is-active" : ""} ${index < step ? "is-done" : ""}`}
                >
                  <span className="events-wizard-step-num">{index + 1}</span>
                  <span>{t(`events.checkout.steps.${key}`)}</span>
                </li>
              ))}
            </ol>

            {message && type && <FormBox type={type} message={message} />}

            <section className="events-wizard-panel">
              {step === 0 && (
                <>
                  <h2 className="events-sectors-title">{t("events.checkout.step1Title")}</h2>
                  <div className="events-counter-row">
                    <div>
                      <p className="events-counter-label">{t("events.public.normalPrice")}</p>
                      <p className="events-counter-price">{formatCurrency(event.priceNormal)}</p>
                    </div>
                    <div className="events-counter">
                      <button type="button" className="events-counter-btn" onClick={() => removeTicket("NORMAL")} disabled={normalCount === 0}>
                        <Minus size={16} />
                      </button>
                      <span className="events-counter-value">{normalCount}</span>
                      <button type="button" className="events-counter-btn" onClick={() => addTicket("NORMAL")} disabled={tickets.length >= MAX_TICKETS}>
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="events-counter-row">
                    <div>
                      <p className="events-counter-label">{t("events.public.memberPrice")}</p>
                      <p className="events-counter-price">{formatCurrency(event.priceMember)}</p>
                    </div>
                    <div className="events-counter">
                      <button type="button" className="events-counter-btn" onClick={() => removeTicket("MEMBER")} disabled={memberCount === 0}>
                        <Minus size={16} />
                      </button>
                      <span className="events-counter-value">{memberCount}</span>
                      <button type="button" className="events-counter-btn" onClick={() => addTicket("MEMBER")} disabled={tickets.length >= MAX_TICKETS}>
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>

                  {tickets.length >= MAX_TICKETS && <p className="events-public-available">{t("events.checkout.maxReached", { max: MAX_TICKETS })}</p>}

                  {tickets.map((tk, index) => {
                    if (tk.priceType !== "MEMBER") return null;
                    memberSlot += 1;
                    return (
                      <div className="events-member-cred" key={`member-${index}`}>
                        <p className="events-member-cred-title">{t("events.checkout.memberCredsTitle", { n: memberSlot })}</p>
                        {canUseAccount && (
                          <label className="events-member-cred-toggle">
                            <input
                              type="checkbox"
                              checked={tk.useAccount}
                              disabled={!tk.useAccount && accountUsed}
                              onChange={(e) => patchTicket(index, { useAccount: e.target.checked, memberNumber: "", memberBirthDate: "" })}
                            />
                            {t("events.checkout.useMyAccount")}
                          </label>
                        )}
                        {!tk.useAccount && (
                          <div className="events-form-grid">
                            <label className="labeled-field">
                              <span className="labeled-field-label">{t("events.checkout.memberNumber")}</span>
                              <input
                                className="events-input"
                                inputMode="numeric"
                                value={tk.memberNumber}
                                onChange={(e) => patchTicket(index, { memberNumber: e.target.value })}
                              />
                            </label>
                            <label className="labeled-field">
                              <span className="labeled-field-label">{t("events.checkout.birthDate")}</span>
                              <input
                                className="events-input"
                                type="date"
                                value={tk.memberBirthDate}
                                onChange={(e) => patchTicket(index, { memberBirthDate: e.target.value })}
                              />
                            </label>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              )}

              {step === 1 && (
                <>
                  <h2 className="events-sectors-title">{t("events.checkout.step2Title")}</h2>
                  <div className="events-sector-list">
                    {tickets.map((tk, index) => (
                      <div className="events-assign-row" key={`assign-${index}`}>
                        <span className="events-assign-label">
                          {t("events.checkout.ticketLabel", { n: index + 1 })} ·{" "}
                          {tk.priceType === "MEMBER" ? t("events.public.memberPrice") : t("events.public.normalPrice")}
                        </span>
                        <select
                          className="events-input"
                          value={tk.sectorId ?? ""}
                          onChange={(e) => patchTicket(index, { sectorId: e.target.value ? Number(e.target.value) : null })}
                        >
                          <option value="">{t("events.checkout.selectSector")}</option>
                          {event.sectors.map((sector) => (
                            <option key={sector.sectorId} value={sector.sectorId} disabled={sector.available === 0}>
                              {sector.name} — {sector.available === 0 ? t("events.checkout.soldOut") : t("events.checkout.seatsLeft", { count: sector.available })}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <h2 className="events-sectors-title">{t("events.checkout.step3Title")}</h2>
                  <div className="events-form-grid">
                    <label className="labeled-field">
                      <span className="labeled-field-label">{t("events.checkout.buyerName")}</span>
                      <input className="events-input" value={buyerName} onChange={(e) => setBuyerName(e.target.value)} required />
                    </label>
                    <label className="labeled-field">
                      <span className="labeled-field-label">{t("events.checkout.buyerEmail")}</span>
                      <input className="events-input" type="email" value={buyerEmail} onChange={(e) => setBuyerEmail(e.target.value)} required />
                    </label>
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <h2 className="events-sectors-title">{t("events.checkout.step4Title")}</h2>
                  <div className="events-summary">
                    {tickets.map((tk, index) => {
                      const sector = event.sectors.find((s) => s.sectorId === tk.sectorId);
                      return (
                        <div className="events-summary-row" key={`sum-${index}`}>
                          <span>
                            {sector?.name ?? "—"} ·{" "}
                            {tk.priceType === "MEMBER" ? t("events.public.memberPrice") : t("events.public.normalPrice")}
                          </span>
                          <span>{formatCurrency(priceOf(tk))}</span>
                        </div>
                      );
                    })}
                    <div className="events-summary-row events-summary-total">
                      <span>{t("events.checkout.total")}</span>
                      <span>{formatCurrency(total)}</span>
                    </div>
                  </div>
                </>
              )}
            </section>

            <div className="events-wizard-actions">
              {step === 0 ? (
                <Link to="/tickets" className="events-button-secondary">
                  <ArrowLeft size={16} />
                  {t("events.checkout.back")}
                </Link>
              ) : (
                <button type="button" className="events-button-secondary" onClick={() => setStep((s) => s - 1)}>
                  <ArrowLeft size={16} />
                  {t("events.checkout.back")}
                </button>
              )}

              {step < 3 ? (
                <button type="button" className="events-button-primary" onClick={goNext} disabled={!canAdvance || validating}>
                  {t("events.checkout.next")}
                  <ArrowRight size={16} />
                </button>
              ) : (
                <button type="button" className="events-button-primary" onClick={submit} disabled={submitting}>
                  <CreditCard size={16} />
                  {submitting ? t("events.checkout.paying") : t("events.checkout.pay")}
                </button>
              )}
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
