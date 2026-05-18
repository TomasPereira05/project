import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  IdCard,
  LogOut,
  Mail,
  Phone,
  Shield,
  User as UserIcon,
  UserPlus,
  Users,
} from "lucide-react";
import Header from "../../../shared/components/Header";
import Footer from "../../../shared/components/Footer";
import { useAuth } from "../../../shared/hooks/useAuth";
import { fetchMember, type Member } from "../../Members";
import { getInitials } from "../../../shared/utils";
import { getMyAthlete, type AthleteAdmin } from "../../Athletes";
import { claimSponsorAccount } from "../../sponsors";
import { roleBadgeColor } from "../utils";

export default function UserPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { username, email, role, activeMemberId, clearAuth } = useAuth();

  const [member, setMember] = useState<Member | null>(null);
  const [athlete, setAthlete] = useState<AthleteAdmin | null>(null);
  const [claimForm, setClaimForm] = useState({ nif: "", email: "", phone: "" });
  const [claimMessage, setClaimMessage] = useState("");
  const [claimError, setClaimError] = useState("");

  useEffect(() => {
    let ignore = false;

    if (!activeMemberId) {
      setMember(null);
      setAthlete(null);
      return;
    }

    fetchMember(activeMemberId)
      .then((res) => {
        if (!ignore) setMember(res);
      })
      .catch(() => {
        if (!ignore) setMember(null);
      });

    getMyAthlete()
      .then((res) => {
        if (!ignore) setAthlete(res);
      })
      .catch(() => {
        if (!ignore) setAthlete(null);
      });

    return () => {
      ignore = true;
    };
  }, [activeMemberId]);

  const handleLogout = () => {
    if (clearAuth) clearAuth();
    navigate("/");
  };

  async function handleSponsorClaim(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setClaimMessage("");
    setClaimError("");

    try {
      const sponsor = await claimSponsorAccount(claimForm);
      setClaimMessage(t("userPage.sponsorClaim.success", { sponsorName: sponsor.name }));
      setClaimForm({ nif: "", email: "", phone: "" });
    } catch (error) {
      setClaimError(error instanceof Error ? error.message : t("userPage.sponsorClaim.error"));
    }
  }

  const displayName = username ?? t("userPage.profile.defaultName");
  const hasSpecialRole = role === "ADMIN" || role === "SECRETARIA";
  const roleText = role ? t(`userPage.roles.${role}`, { defaultValue: role }) : t("userPage.emptyValue");

  return (
    <div>
      <Header />
      <main className="member-page">
        <div className="member-detail-container">
          <div className="user-page-topbar">
            <button onClick={() => window.history.back()} className="user-back-button">
              <ArrowLeft size={18} />
              {t("userPage.actions.back")}
            </button>
          </div>

          <section className="user-profile-card">
            <div className="user-profile-banner"></div>
            <div className="user-profile-body">
              <div className="user-profile-main">
                <div className="user-profile-identity">
                  <div className="user-avatar">{getInitials(displayName)}</div>
                  <div className="user-profile-title-group">
                    <h1 className="user-profile-title">{displayName}</h1>
                    <p className="user-profile-subtitle">{t("userPage.profile.subtitle")}</p>
                  </div>
                </div>

                <div className="user-badges">
                  {hasSpecialRole && <span className={`user-role-badge ${roleBadgeColor(role)}`}>{roleText}</span>}
                  {member && (
                    <span className="user-member-badge">
                      {t("userPage.member.badge", { memberNumber: member.memberNumber })}
                    </span>
                  )}
                </div>
              </div>

              <div className="user-profile-actions">
                <button type="button" onClick={handleLogout} className="user-button-outline">
                  <LogOut size={18} />
                  {t("userPage.actions.logout")}
                </button>
              </div>
            </div>
          </section>

          <section className="user-section-card">
            <div className="user-section-header">
              <div className="user-section-icon">
                <UserIcon size={20} />
              </div>
              <div>
                <h2 className="user-section-title">{t("userPage.account.title")}</h2>
                <p className="user-section-description">{t("userPage.account.description")}</p>
              </div>
            </div>

            <div className="user-section-body">
              <div className="user-info-grid">
                <div className="user-info-item">
                  <UserIcon size={18} className="user-info-icon" />
                  <div>
                    <p className="user-info-label">{t("userPage.account.username")}</p>
                    <p className="user-info-value">{displayName}</p>
                  </div>
                </div>
                <div className="user-info-item">
                  <Mail size={18} className="user-info-icon" />
                  <div>
                    <p className="user-info-label">{t("userPage.account.email")}</p>
                    <p className="user-info-value-break">{email ?? t("userPage.emptyValue")}</p>
                  </div>
                </div>
                {hasSpecialRole && (
                  <div className="user-info-item">
                    <Shield size={18} className="user-info-icon" />
                    <div>
                      <p className="user-info-label">{t("userPage.account.role")}</p>
                      <p className="user-info-value">{roleText}</p>
                    </div>
                  </div>
                )}
                {member && (
                  <div className="user-info-item">
                    <IdCard size={18} className="user-info-icon" />
                    <div>
                      <p className="user-info-label">{t("userPage.account.memberNumber")}</p>
                      <p className="user-info-value">#{member.memberNumber}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="user-section-card">
            <div className="user-section-header">
              <div className="user-section-icon">
                <Users size={20} />
              </div>
              <div>
                <h2 className="user-section-title">{t("userPage.member.title")}</h2>
                <p className="user-section-description">
                  {member ? t("userPage.member.hasMemberDescription") : t("userPage.member.noMemberDescription")}
                </p>
              </div>
            </div>

            <div className="user-link-actions">
              {member ? (
                <Link to={`/members/${member.memberId}`} className="user-button-primary">
                  <Users size={18} />
                  {t("userPage.member.view")}
                </Link>
              ) : (
                <Link to="/members/create" className="user-button-primary">
                  <UserPlus size={18} />
                  {t("userPage.member.become")}
                </Link>
              )}
            </div>
          </section>

          {athlete && (
            <section className="user-section-card">
              <div className="user-section-header">
                <div className="user-section-icon">
                  <UserPlus size={20} />
                </div>
                <div>
                  <h2 className="user-section-title">{t("userPage.athlete.title")}</h2>
                  <p className="user-section-description">
                    {t("userPage.athlete.currentCategory", { category: athlete.teamCategoryLabel })}
                  </p>
                </div>
              </div>

              <div className="user-link-actions">
                <Link to={`/athletes/${athlete.athleteId}`} className="user-button-primary">
                  <UserPlus size={18} />
                  {t("userPage.athlete.view")}
                </Link>
              </div>
            </section>
          )}

          <section className="user-section-card">
            <div className="user-section-header">
              <div className="user-section-icon">
                <IdCard size={20} />
              </div>
              <div>
                <h2 className="user-section-title">{t("userPage.sponsorClaim.title")}</h2>
                <p className="user-section-description">{t("userPage.sponsorClaim.description")}</p>
              </div>
            </div>

            <form className="user-claim-form" onSubmit={handleSponsorClaim}>
              <label className="user-claim-label">
                {t("userPage.sponsorClaim.nif")}
                <input
                  className="member-input"
                  required
                  value={claimForm.nif}
                  onChange={(event) => setClaimForm((current) => ({ ...current, nif: event.target.value }))}
                />
              </label>
              <label className="user-claim-label">
                {t("userPage.sponsorClaim.email")}
                <input
                  className="member-input"
                  required
                  type="email"
                  value={claimForm.email}
                  onChange={(event) => setClaimForm((current) => ({ ...current, email: event.target.value }))}
                />
              </label>
              <label className="user-claim-label">
                {t("userPage.sponsorClaim.phone")}
                <input
                  className="member-input"
                  required
                  value={claimForm.phone}
                  onChange={(event) => setClaimForm((current) => ({ ...current, phone: event.target.value }))}
                />
              </label>
              <div className="user-claim-actions">
                <button type="submit" className="user-button-primary">
                  <Phone size={18} />
                  {t("userPage.sponsorClaim.submit")}
                </button>
                {claimMessage ? <p className="user-claim-success">{claimMessage}</p> : null}
                {claimError ? <p className="user-claim-error">{claimError}</p> : null}
              </div>
            </form>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
