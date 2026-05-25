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
import { useAuth } from "../../../shared/hooks/useAuth";
import { getInitials } from "../../../shared/utils";
import { useSponsorClaim, useUserProfile } from "../hooks";
import { isStaffRole, roleBadgeColor } from "../utils";
import { HERO_IMG_SRC } from "../../../shared/config/config";
import { FileAvatar, FileUploadList } from "../../files";

export default function UserPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { id, username, email, role, activeMemberId, clearAuth } = useAuth();

  const { member, athlete } = useUserProfile(activeMemberId);
  const { claimError, claimForm, claimMessage, claimed, handleSponsorClaim, setClaimForm } =
    useSponsorClaim(t);

  const handleLogout = () => {
    if (clearAuth) clearAuth();
    navigate("/");
  };

  const displayName = username ?? t("userPage.profile.defaultName");
  const hasSpecialRole = isStaffRole(role);
  const roleText = role ? t(`userPage.roles.${role}`, { defaultValue: role }) : t("userPage.emptyValue");

  return (
    <main className="member-page">
      <div className="user-form-bg" style={{ backgroundImage: `url(${HERO_IMG_SRC})` }} />
      <div className="user-form-overlay" />
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
                <FileAvatar
                  alt={displayName}
                  className="user-avatar"
                  fallback={activeMemberId ? { ownerType: "MEMBER", ownerId: activeMemberId, kind: "MEMBER_PHOTO" } : undefined}
                  kind="USER_PROFILE_PHOTO"
                  ownerId={id}
                  ownerType="USER"
                  uploadLabel={t("files.actions.choosePhoto")}
                >
                  {getInitials(displayName)}
                </FileAvatar>
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
            <div className="user-section-body pt-0">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FileUploadList
                  accept="application/pdf,image/png,image/jpeg,image/webp"
                  kind="ATHLETE_ID_CARD"
                  ownerId={athlete.athleteId}
                  ownerType="ATHLETE"
                  title={t("files.kinds.ATHLETE_ID_CARD")}
                />
                <FileUploadList
                  accept="application/pdf,image/png,image/jpeg,image/webp"
                  kind="ATHLETE_MEDICAL_EXAM"
                  ownerId={athlete.athleteId}
                  ownerType="ATHLETE"
                  title={t("files.kinds.ATHLETE_MEDICAL_EXAM")}
                />
              </div>
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

          {claimed ? (
            <div className="user-link-actions">
              {claimMessage ? <p className="user-claim-success">{claimMessage}</p> : null}
              <Link to="/sponsors/my" className="user-button-primary">
                <IdCard size={18} />
                {t("userPage.sponsorClaim.viewMine")}
              </Link>
            </div>
          ) : (
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
                {claimError ? <p className="user-claim-error">{claimError}</p> : null}
              </div>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
