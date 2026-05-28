import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { CheckCircle2, PencilLine, Shield, User, Wallet, XCircle, ArrowLeft, Building2, MapPin, Mail, Phone, Calendar, CreditCard } from "lucide-react";
import { Link, useLocation, useParams, Navigate } from "react-router-dom";
import { useMemberDetail } from "../hooks";
import { memberStatusColor, monthName } from "../utils";
import { formatCurrency, formatDate, getInitials } from "../../../shared/utils";
import { useAuth } from "../../../shared/hooks/useAuth";
import { HERO_IMG_SRC } from "../../../shared/config/config";
import { FileAvatar } from "../../files/components/FileControls";

const ALL_HISTORY_SEASONS = "all";

export default function MemberPage() {
  const { t } = useTranslation();
  const { memberId } = useParams();
  const location = useLocation();
  const { role, activeMemberId } = useAuth();

  const isAdmin = role === "ADMIN" || role === "SECRETARIA";
  const memberBasePath = location.pathname.startsWith("/admin") ? "/admin/members" : "/members";
  const isSelf = activeMemberId === Number(memberId);
  const [historySeasonFilter, setHistorySeasonFilter] = useState("");
  const {
    availableSeasons,
    debtSummary,
    errorMessage,
    feePage,
    feeTotalPages,
    feedback,
    feeOptions,
    goToNextFeePage,
    goToPreviousFeePage,
    handleApprove,
    handlePaySelectedFees,
    handleReject,
    isLoading,
    isPaying,
    member,
    paymentHistory,
    selectedFees,
    selectedFeeOptions,
    selectedTotalCents,
    selectOverdueFees,
    selectSeasonFees,
    toggleFee,
    visibleFeeOptions,
  } =
    useMemberDetail(memberId, isAdmin || isSelf, t);

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
    () => selectedHistorySeason === ALL_HISTORY_SEASONS
      ? paidPaymentHistory
      : paidPaymentHistory.filter((item) => item.season === selectedHistorySeason),
    [selectedHistorySeason, paidPaymentHistory],
  );

  useEffect(() => {
    setHistorySeasonFilter("");
  }, [memberId]);

  if (!isAdmin && !isSelf) {
    return <Navigate to="/" replace />;
  }

  if (isLoading) {
    return (
      <main className="member-page-centered">
        <MemberPageBackground />
        <div className="member-loading-container">
          <div className="member-loading-spinner"></div>
          <p className="member-loading-text">{t("members.detail.loading")}</p>
        </div>
      </main>
    );
  }

  if (errorMessage && !member) {
    return (
      <main className="member-page">
        <MemberPageBackground />
        <div className="member-detail-container">
          <div className="member-alert-error">{errorMessage}</div>
          <button onClick={() => window.history.back()} className="member-btn-back member-detail-back">
            <ArrowLeft size={16} />
            {t("members.common.back")}
          </button>
        </div>
      </main>
    );
  }

  if (!member) {
    return null;
  }

  return (
    <main className="member-page">
      <MemberPageBackground />
      <div className="member-detail-container">
        <div className="member-topbar">
          <button onClick={() => window.history.back()} className="member-btn-back member-detail-back">
            <ArrowLeft size={18} />
            {t("members.common.back")}
          </button>
        </div>

        {feedback && (
          <div className="member-alert-success">
            <CheckCircle2 size={20} className="member-alert-icon-success" />
            <p className="member-alert-text">{feedback}</p>
          </div>
        )}
        {errorMessage && (
          <div className="member-alert-error">
            <XCircle size={20} className="member-alert-icon-error" />
            <p className="member-alert-text">{errorMessage}</p>
          </div>
        )}

        <section className="member-section-card">
          <div className="member-profile-cover"></div>
          <div className="member-profile-body">
            <div className="member-profile-header">
              <div className="member-profile-info">
                <FileAvatar
                  alt={member.completeName}
                  className="member-profile-avatar"
                  kind="MEMBER_PHOTO"
                  ownerId={member.memberId}
                  ownerType="MEMBER"
                >
                  {getInitials(member.completeName)}
                </FileAvatar>
                <div className="member-profile-name-block">
                  <h1 className="member-profile-name">{member.completeName}</h1>
                  <p className="member-profile-number">
                    {member.memberNumber > 0 ? t("members.detail.memberNumber", { memberNumber: member.memberNumber }) : t("members.detail.pendingNumber")}
                  </p>
                </div>
              </div>

              <div className="member-profile-badges">
                <span className={`member-status-badge ${memberStatusColor(member.status)}`}>{t(`members.labels.statuses.${member.status}`)}</span>
                <span className="member-category-badge">{t(`members.labels.categories.${member.category}`)}</span>
              </div>
            </div>

            <div className="member-inline-meta">
              <div className="member-inline-meta-item">
                <MapPin size={16} />
                <span>{member.city}</span>
              </div>
              <div className="member-inline-meta-item">
                <Calendar size={16} />
                <span>{t("members.detail.memberSince", { date: formatDate(member.registrationDate) })}</span>
              </div>
            </div>

            <div className="member-profile-actions">
              <Link className="member-btn-primary-sm" to={`${memberBasePath}/${member.memberId}/edit`}>
                <PencilLine size={18} />
                {t("members.detail.editProfile")}
              </Link>

              {isAdmin && member.status === "PENDENTE" && (
                <>
                  <button className="member-btn-approve" onClick={handleApprove} type="button">
                    <CheckCircle2 size={18} />
                    {t("members.detail.actions.approve")}
                  </button>
                  <button className="member-btn-reject" onClick={handleReject} type="button">
                    <XCircle size={18} />
                    {t("members.detail.actions.reject")}
                  </button>
                </>
              )}
            </div>
          </div>
        </section>

        {isAdmin && (
          <section className="member-section-card">
            <div className="member-section-header">
              <div className="member-section-icon">
                <Shield size={20} />
              </div>
              <div>
                <h2 className="member-section-title">{t("members.detail.admin.title")}</h2>
                <p className="member-section-desc">{t("members.detail.admin.description")}</p>
              </div>
            </div>

            <div className="member-section-body">
              <div className="member-admin-grid">
                <div className="member-admin-column">
                  <InfoRow icon={<Mail size={18} className="member-info-icon" />} label={t("members.fields.email")} value={member.email} breakValue />
                  <InfoRow icon={<Phone size={18} className="member-info-icon" />} label={t("members.fields.phone")} value={member.phone} />
                  <InfoRow icon={<Building2 size={18} className="member-info-icon" />} label={t("members.fields.homePhone")} value={member.homePhone || t("members.common.notProvided")} />
                  <InfoRow icon={<Building2 size={18} className="member-info-icon" />} label={t("members.fields.nif")} value={member.nif || t("members.common.notProvided")} />
                </div>

                <div className="member-admin-column">
                  <div className="member-info-row">
                    <MapPin size={18} className="member-info-icon" />
                    <div>
                      <p className="member-field-title">{t("members.fields.fullAddress")}</p>
                      <p className="member-field-value">{member.address}</p>
                      <p className="member-helper-text-spaced">{member.postalCode} - {member.city}</p>
                    </div>
                  </div>
                  <InfoRow icon={<Wallet size={18} className="member-info-icon" />} label={t("members.fields.billingLocation")} value={member.billingLocation || t("members.common.notDefined")} />
                </div>
              </div>

              <div className="member-admin-footer-grid">
                <div>
                  <p className="member-field-title-spaced">{t("members.detail.admin.approval")}</p>
                  <p className="member-field-value-plain">{member.approvalDate ? formatDate(member.approvalDate) : t("members.labels.statuses.PENDENTE")}</p>
                </div>
                <div className="member-admin-footer-wide">
                  <p className="member-field-title-spaced">{t("members.detail.admin.consents")}</p>
                  <div className="member-consent-row">
                    <span>{t("members.detail.admin.privacy")}: <span className={member.privacyAccepted ? "member-positive-text" : "member-negative-text"}>{member.privacyAccepted ? t("members.common.yes") : t("members.common.no")}</span></span>
                    <span>{t("members.detail.admin.communications")}: <span className={member.comsAccepted ? "member-positive-text" : "member-negative-text"}>{member.comsAccepted ? t("members.common.yes") : t("members.common.no")}</span></span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {(isSelf || isAdmin) && (
          <section className="member-section-card">
            <div className="member-section-header-between">
              <div className="member-section-heading-row">
                <div className="member-section-icon">
                  <Wallet size={20} />
                </div>
                <div>
                  <h2 className="member-section-title">{t("members.detail.finance.title")}</h2>
                  <p className="member-section-desc">{t("members.detail.finance.description")}</p>
                </div>
              </div>
            </div>

            <div className="member-section-body">
              <div className="member-finance-grid">
                <div className="member-finance-card">
                  <p className="member-finance-label">{t("members.detail.finance.monthlyQuota")}</p>
                  <p className="member-finance-value">{formatCurrency(member.membershipQuota)}</p>
                </div>
                <div className="member-finance-card-danger">
                  <p className="member-finance-label-danger">{t("members.detail.finance.overdueQuotas")}</p>
                  <p className="member-finance-value-danger">{debtSummary.pendingCount}</p>
                </div>
                <div className="member-finance-card-danger">
                  <p className="member-finance-label-danger">{t("members.detail.finance.debtTotal")}</p>
                  <p className="member-finance-value-danger">{formatCurrency(debtSummary.pendingCents)}</p>
                </div>
              </div>

              {feeOptions.length > 0 && (
                <div className="member-fee-selector">
                  <div className="member-fee-selector-header">
                    <div>
                      <h3 className="member-payment-title">{t("members.detail.finance.selectTitle")}</h3>
                      <p className="member-helper-text-spaced">{t("members.detail.finance.selectDescription")}</p>
                    </div>
                    <div className="member-fee-total">
                      <span>{t("members.detail.finance.selectedTotal")}</span>
                      <strong>{formatCurrency(selectedTotalCents)}</strong>
                    </div>
                  </div>

                  <div className="member-fee-actions">
                    <button className="member-btn-outline-compact" onClick={selectOverdueFees} type="button">
                      {t("members.detail.finance.selectOverdue")}
                    </button>
                    {availableSeasons.map((season) => (
                      <button className="member-btn-outline-compact" key={season} onClick={() => selectSeasonFees(season)} type="button">
                        {t("members.detail.finance.selectSeason", { season })}
                      </button>
                    ))}
                  </div>

                  <div className="member-fee-table-wrap">
                    <table className="member-fee-table">
                      <thead>
                        <tr>
                          <th>{t("members.detail.finance.select")}</th>
                          <th>{t("members.detail.finance.month")}</th>
                          <th>{t("members.detail.finance.season")}</th>
                          <th>{t("members.detail.finance.dueDate")}</th>
                          <th>{t("members.detail.finance.value")}</th>
                          <th>{t("members.detail.finance.status")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleFeeOptions.map((option) => {
                          const key = `${option.season}-${option.month}`;
                          const checked = selectedFees.has(key);
                          return (
                            <tr className={!option.selectable ? "member-fee-row-disabled" : ""} key={key}>
                              <td>
                                <input
                                  aria-label={t("members.detail.finance.selectFee", { month: monthName(option.month, t), season: option.season })}
                                  checked={checked}
                                  className="member-checkbox"
                                  disabled={!option.selectable}
                                  onChange={() => toggleFee(option)}
                                  type="checkbox"
                                />
                              </td>
                              <td>{monthName(option.month, t)}</td>
                              <td>{option.season}</td>
                              <td>{formatDate(option.dueDate)}</td>
                              <td className="member-fee-table-value">{formatCurrency(option.amount)}</td>
                              <td>{option.status ? t(`members.detail.finance.statuses.${option.status}`) : t("members.detail.finance.statuses.OPEN")}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {feeTotalPages > 1 && (
                    <div className="member-fee-pagination">
                      <button className="member-btn-outline-compact" disabled={feePage === 1} onClick={goToPreviousFeePage} type="button">
                        {t("members.detail.finance.previous")}
                      </button>
                      <span>{t("members.detail.finance.page", { page: feePage, totalPages: feeTotalPages })}</span>
                      <button className="member-btn-outline-compact" disabled={feePage === feeTotalPages} onClick={goToNextFeePage} type="button">
                        {t("members.detail.finance.next")}
                      </button>
                    </div>
                  )}

                  <button
                    className="member-btn-primary-sm"
                    disabled={isPaying || selectedFeeOptions.length === 0}
                    onClick={handlePaySelectedFees}
                    type="button"
                  >
                    <CreditCard size={18} />
                    {isPaying ? t("members.detail.finance.paymentStarting") : t("members.detail.finance.paySelected")}
                  </button>
                </div>
              )}

              <div className="member-payment-history-header">
                <h3 className="member-payment-title member-payment-title-inline">{t("members.detail.finance.paymentHistory")}</h3>
                {paidPaymentHistory.length > 0 && (
                  <label className="member-history-filter">
                    <span>{t("members.detail.finance.filterSeason")}</span>
                    <select
                      className="member-history-select"
                      onChange={(event) => setHistorySeasonFilter(event.target.value)}
                      value={selectedHistorySeason}
                    >
                      <option value={ALL_HISTORY_SEASONS}>{t("members.detail.finance.allSeasons")}</option>
                      {historySeasons.map((season) => (
                        <option key={season} value={season}>{season}</option>
                      ))}
                    </select>
                  </label>
                )}
              </div>

              {paidPaymentHistory.length === 0 ? (
                <div className="member-empty-history">
                  <User size={32} className="member-empty-history-icon" />
                  <p className="member-alert-text">{t("members.detail.finance.emptyHistory")}</p>
                </div>
              ) : filteredPaymentHistory.length === 0 ? (
                <div className="member-empty-history">
                  <User size={32} className="member-empty-history-icon" />
                  <p className="member-alert-text">{t("members.detail.finance.emptyFilteredHistory")}</p>
                </div>
              ) : (
                <div className="member-fee-table-wrap">
                  <table className="member-fee-table">
                    <thead>
                      <tr>
                        <th>{t("members.detail.finance.month")}</th>
                        <th>{t("members.detail.finance.season")}</th>
                        <th>{t("members.detail.finance.dueDate")}</th>
                        <th>{t("members.detail.finance.value")}</th>
                        <th>{t("members.detail.finance.status")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPaymentHistory.map((item) => (
                        <tr key={item.id}>
                          <td>{item.label}</td>
                          <td>{item.season}</td>
                          <td>{formatDate(item.dueDate)}</td>
                          <td className="member-fee-table-value">{formatCurrency(item.amountCents)}</td>
                          <td>{t("members.detail.finance.statuses.PAID")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function MemberPageBackground() {
  return (
    <>
      <div className="member-form-bg" style={{ backgroundImage: `url(${HERO_IMG_SRC})` }} />
      <div className="member-form-overlay" />
    </>
  );
}

function InfoRow({ icon, label, value, breakValue = false }: { icon: ReactNode; label: string; value: string; breakValue?: boolean }) {
  return (
    <div className="member-info-row">
      {icon}
      <div>
        <p className="member-field-title">{label}</p>
        <p className={breakValue ? "member-field-value-break" : "member-field-value"}>{value}</p>
      </div>
    </div>
  );
}
