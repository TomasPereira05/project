import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { CheckCircle2, PencilLine, Shield, User, Wallet, XCircle, ArrowLeft, Building2, MapPin, Mail, Phone, Calendar } from "lucide-react";
import { Link, useParams, Navigate } from "react-router-dom";
import { useMemberDetail } from "../hooks";
import { memberStatusColor } from "../utils";
import { formatCurrency, formatDate, getInitials } from "../../../shared/utils";
import { useAuth } from "../../../shared/hooks/useAuth";

export default function MemberPage() {
  const { t } = useTranslation();
  const { memberId } = useParams();
  const { role, activeMemberId } = useAuth();

  const isAdmin = role === "ADMIN" || role === "SECRETARIA";
  const isSelf = activeMemberId === Number(memberId);
  const { debtSummary, errorMessage, feedback, handleApprove, handleReject, isLoading, member, paymentHistory } =
    useMemberDetail(memberId, isAdmin || isSelf, t);

  if (!isAdmin && !isSelf) {
    return <Navigate to="/" replace />;
  }

  if (isLoading) {
    return (
      <main className="member-page-centered">
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
        <div className="member-detail-container">
          <div className="member-alert-error">{errorMessage}</div>
          <button onClick={() => window.history.back()} className="member-btn-back">
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
      <div className="member-detail-container">
        <div className="member-topbar">
          <button onClick={() => window.history.back()} className="member-btn-back">
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
                <div className="member-profile-avatar">{getInitials(member.completeName)}</div>
                <div className="member-profile-name-block">
                  <h1 className="member-profile-name">{member.completeName}</h1>
                  <p className="member-profile-number">{t("members.detail.memberNumber", { memberNumber: member.memberNumber })}</p>
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
              <Link className="member-btn-primary-sm" to={`/members/${member.memberId}/edit`}>
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

              <h3 className="member-payment-title">{t("members.detail.finance.paymentHistory")}</h3>

              {paymentHistory.length === 0 ? (
                <div className="member-empty-history">
                  <User size={32} className="member-empty-history-icon" />
                  <p className="member-alert-text">{t("members.detail.finance.emptyHistory")}</p>
                </div>
              ) : (
                <div className="member-payment-list">
                  {paymentHistory.map((item) => (
                    <div className={`member-payment-row ${item.status === "PENDING" ? "member-payment-row-pending" : "member-payment-row-paid"}`} key={item.id}>
                      <div>
                        <p className="member-payment-label">{item.label}</p>
                        <p className="member-helper-text-spaced">{t("members.detail.finance.paymentMeta", { season: item.season, dueDate: formatDate(item.dueDate) })}</p>
                      </div>

                      <div className="member-text-right">
                        <p className={`member-payment-value ${item.status === "PENDING" ? "member-negative-text" : "member-positive-text"}`}>{formatCurrency(item.amountCents)}</p>
                        <p className="member-helper-text-spaced">
                          {item.status === "PAID" ? t("members.detail.finance.paidAt", { date: formatDate(item.paidDate) }) : t("members.detail.finance.overdue")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
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
