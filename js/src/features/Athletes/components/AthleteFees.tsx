import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, CreditCard, User, Wallet } from "lucide-react";
import { useAthleteFees } from "../hooks";
import { formatCurrency, formatDate, monthName } from "../../../shared/utils";
import { BASE_URL } from "../../../shared/config/config";

const ALL_HISTORY_SEASONS = "all";

/**
 * Pagamento das mensalidades de um atleta gerido pela conta (encarregado). Estrutura e visual
 * espelham o "Resumo Financeiro" do sócio, mas com lógica/CSS próprios de Atletas (motor de
 * quotas partilhado via useFeePayments). Entra-se a partir de "Os Meus Atletas" no perfil, que
 * passa o memberId e o nome via router state.
 */
export default function AthleteFees() {
  const { t } = useTranslation();
  const location = useLocation();
  const state = (location.state ?? {}) as { memberId?: number; name?: string };
  const memberId = state.memberId;
  const athleteName = state.name ?? "";

  const {
    availableSeasons,
    debtSummary,
    errorMessage,
    feeOptions,
    feePage,
    feeTotalPages,
    goToNextFeePage,
    goToPreviousFeePage,
    handlePaySelectedFees,
    isLoading,
    isPaying,
    monthlyCents,
    paymentHistory,
    selectedFees,
    selectedFeeOptions,
    selectedTotalCents,
    selectOverdueFees,
    selectSeasonFees,
    toggleFee,
    visibleFeeOptions,
  } = useAthleteFees(memberId, t);

  const [historySeasonFilter, setHistorySeasonFilter] = useState("");
  useEffect(() => {
    setHistorySeasonFilter("");
  }, [memberId]);

  const paidPaymentHistory = useMemo(
    () => paymentHistory.filter((item) => item.status === "PAID"),
    [paymentHistory],
  );
  const historySeasons = useMemo(
    () => Array.from(new Set(paidPaymentHistory.map((item) => item.season))).sort((a, b) => b.localeCompare(a)),
    [paidPaymentHistory],
  );
  const selectedHistorySeason = historySeasonFilter || historySeasons[0] || ALL_HISTORY_SEASONS;
  const filteredPaymentHistory = useMemo(
    () =>
      selectedHistorySeason === ALL_HISTORY_SEASONS
        ? paidPaymentHistory
        : paidPaymentHistory.filter((item) => item.season === selectedHistorySeason),
    [selectedHistorySeason, paidPaymentHistory],
  );

  return (
    <main className="athlete-fees-page">
      <div className="athlete-fees-container">
        <Link to="/user" className="athlete-fees-back">
          <ArrowLeft size={18} />
          {t("athletes.fees.back")}
        </Link>

        <div>
          <h1 className="athlete-fees-title">{t("athletes.fees.title")}</h1>
          {athleteName && <p className="athlete-fees-subtitle">{athleteName}</p>}
        </div>

        {!memberId ? (
          <p className="athlete-fees-empty">{t("athletes.fees.noContext")}</p>
        ) : isLoading ? (
          <p className="athlete-fees-empty">{t("athletes.fees.loading")}</p>
        ) : (
          <section className="athlete-fee-section">
            <div className="athlete-fee-section-header">
              <div className="athlete-fee-section-icon">
                <Wallet size={20} />
              </div>
              <div>
                <h2 className="athlete-fee-section-title">{t("athletes.fees.sectionTitle")}</h2>
                <p className="athlete-fee-section-desc">{t("athletes.fees.sectionDescription")}</p>
              </div>
            </div>

            <div className="athlete-fee-section-body">
              <div className="athlete-fee-grid">
                <div className="athlete-fee-card">
                  <p className="athlete-fee-label">{t("athletes.fees.monthlyFee")}</p>
                  <p className="athlete-fee-value">{formatCurrency(monthlyCents)}</p>
                </div>
                <div className="athlete-fee-card-danger">
                  <p className="athlete-fee-label-danger">{t("athletes.fees.overdueFees")}</p>
                  <p className="athlete-fee-value-danger">{debtSummary.pendingCount}</p>
                </div>
                <div className="athlete-fee-card-danger">
                  <p className="athlete-fee-label-danger">{t("athletes.fees.debtTotal")}</p>
                  <p className="athlete-fee-value-danger">{formatCurrency(debtSummary.pendingCents)}</p>
                </div>
              </div>

              {feeOptions.length > 0 && (
                <div className="athlete-fee-selector">
                  <div className="athlete-fee-selector-header">
                    <div>
                      <h3 className="athlete-fee-payment-title">{t("athletes.fees.selectTitle")}</h3>
                      <p className="athlete-fee-helper-text">{t("athletes.fees.selectDescription")}</p>
                    </div>
                    <div className="athlete-fee-total">
                      <span>{t("athletes.fees.selectedTotal")}</span>
                      <strong>{formatCurrency(selectedTotalCents)}</strong>
                    </div>
                  </div>

                  <div className="athlete-fee-actions">
                    <button className="athlete-fee-btn-outline" onClick={selectOverdueFees} type="button">
                      {t("athletes.fees.selectOverdue")}
                    </button>
                    {availableSeasons.map((season) => (
                      <button
                        className="athlete-fee-btn-outline"
                        key={season}
                        onClick={() => selectSeasonFees(season)}
                        type="button"
                      >
                        {t("athletes.fees.selectSeason", { season })}
                      </button>
                    ))}
                  </div>

                  <div className="athlete-fee-table-wrap">
                    <table className="athlete-fee-table">
                      <thead>
                        <tr>
                          <th>{t("athletes.fees.select")}</th>
                          <th>{t("athletes.fees.month")}</th>
                          <th>{t("athletes.fees.season")}</th>
                          <th>{t("athletes.fees.dueDate")}</th>
                          <th>{t("athletes.fees.value")}</th>
                          <th>{t("athletes.fees.status")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleFeeOptions.map((option) => {
                          const key = `${option.season}-${option.month}`;
                          const checked = selectedFees.has(key);
                          return (
                            <tr className={!option.selectable ? "athlete-fee-row-disabled" : ""} key={key}>
                              <td>
                                <input
                                  aria-label={t("athletes.fees.selectFee", {
                                    month: monthName(option.month, t),
                                    season: option.season,
                                  })}
                                  checked={checked}
                                  className="athlete-fee-checkbox"
                                  disabled={!option.selectable}
                                  onChange={() => toggleFee(option)}
                                  type="checkbox"
                                />
                              </td>
                              <td>{monthName(option.month, t)}</td>
                              <td>{option.season}</td>
                              <td>{formatDate(option.dueDate)}</td>
                              <td className="athlete-fee-table-value">{formatCurrency(option.amount)}</td>
                              <td>
                                {option.status
                                  ? t(`athletes.fees.statuses.${option.status}`)
                                  : t("athletes.fees.statuses.OPEN")}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {feeTotalPages > 1 && (
                    <div className="athlete-fee-pagination">
                      <button
                        className="athlete-fee-btn-outline"
                        disabled={feePage === 1}
                        onClick={goToPreviousFeePage}
                        type="button"
                      >
                        {t("athletes.fees.previous")}
                      </button>
                      <span>{t("athletes.fees.page", { page: feePage, totalPages: feeTotalPages })}</span>
                      <button
                        className="athlete-fee-btn-outline"
                        disabled={feePage === feeTotalPages}
                        onClick={goToNextFeePage}
                        type="button"
                      >
                        {t("athletes.fees.next")}
                      </button>
                    </div>
                  )}

                  <button
                    className="athlete-fee-btn-primary"
                    disabled={isPaying || selectedFeeOptions.length === 0}
                    onClick={handlePaySelectedFees}
                    type="button"
                  >
                    <CreditCard size={18} />
                    {isPaying ? t("athletes.fees.paymentStarting") : t("athletes.fees.paySelected")}
                  </button>
                </div>
              )}

              <div className="athlete-fee-history-header">
                <h3 className="athlete-fee-payment-title athlete-fee-payment-title-inline">
                  {t("athletes.fees.paymentHistory")}
                </h3>
                {paidPaymentHistory.length > 0 && (
                  <label className="athlete-fee-history-filter">
                    <span>{t("athletes.fees.filterSeason")}</span>
                    <select
                      className="athlete-fee-history-select"
                      onChange={(event) => setHistorySeasonFilter(event.target.value)}
                      value={selectedHistorySeason}
                    >
                      <option value={ALL_HISTORY_SEASONS}>{t("athletes.fees.allSeasons")}</option>
                      {historySeasons.map((season) => (
                        <option key={season} value={season}>
                          {season}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </div>

              {paidPaymentHistory.length === 0 ? (
                <div className="athlete-fee-empty-history">
                  <User size={32} className="athlete-fee-empty-history-icon" />
                  <p>{t("athletes.fees.emptyHistory")}</p>
                </div>
              ) : filteredPaymentHistory.length === 0 ? (
                <div className="athlete-fee-empty-history">
                  <User size={32} className="athlete-fee-empty-history-icon" />
                  <p>{t("athletes.fees.emptyFilteredHistory")}</p>
                </div>
              ) : (
                <div className="athlete-fee-table-wrap">
                  <table className="athlete-fee-table">
                    <thead>
                      <tr>
                        <th>{t("athletes.fees.month")}</th>
                        <th>{t("athletes.fees.season")}</th>
                        <th>{t("athletes.fees.dueDate")}</th>
                        <th>{t("athletes.fees.value")}</th>
                        <th>{t("athletes.fees.status")}</th>
                        <th>{t("athletes.fees.receipt")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPaymentHistory.map((item) => (
                        <tr key={item.id}>
                          <td>{item.label}</td>
                          <td>{item.season}</td>
                          <td>{formatDate(item.dueDate)}</td>
                          <td className="athlete-fee-table-value">{formatCurrency(item.amountCents)}</td>
                          <td>{t("athletes.fees.statuses.PAID")}</td>
                          <td>
                            {item.receiptPaymentId ? (
                              <a
                                className="athlete-fee-link"
                                href={`${BASE_URL}/payments/${item.receiptPaymentId}/receipt`}
                                target="_blank"
                                rel="noreferrer"
                              >
                                {t("athletes.fees.viewReceipt")}
                              </a>
                            ) : (
                              "-"
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {errorMessage && <p className="athlete-fees-error">{errorMessage}</p>}
          </section>
        )}
      </div>
    </main>
  );
}
