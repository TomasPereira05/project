import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ArrowRight, CreditCard, Minus, Plus } from "lucide-react";
import Header from "../../../shared/components/Header";
import Footer from "../../../shared/components/Footer";
import FormBox from "../../../shared/components/MessageFormBox";
import { formatCurrency } from "../../../shared/utils";
import { FIELD_VIEW_IMG_SRC } from "../../../shared/config/config";
import { formatEventDateTime } from "../utils/datetime";
import { MAX_TICKETS, useTicketCheckout } from "../hooks";

const STEP_KEYS = ["tickets", "sectors", "buyer", "payment"] as const;

export default function TicketCheckout() {
  const { t } = useTranslation();
  const { eventId: eventIdParam } = useParams();
  const eventId = Number(eventIdParam);
  const {
    event,
    loading,
    message,
    type,
    step,
    tickets,
    normalCount,
    memberCount,
    accountUsed,
    canUseAccount,
    buyerName,
    setBuyerName,
    buyerEmail,
    setBuyerEmail,
    submitting,
    validating,
    total,
    priceOf,
    canAdvance,
    addTicket,
    removeTicket,
    patchTicket,
    goNext,
    goBack,
    submit,
  } = useTicketCheckout(eventId, t);

  let memberSlot = 0; // índice do bilhete de sócio, para o título "Bilhete de sócio N"

  return (
    <div>
      <Header />
      <main className="events-public-page">
        <div className="events-public-bg" style={{ backgroundImage: `url(${FIELD_VIEW_IMG_SRC})` }} />
        <div className="events-public events-wizard relative z-20">
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
                <button type="button" className="events-button-secondary" onClick={goBack}>
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
        </div>
      </main>
      <Footer />
    </div>
  );
}
