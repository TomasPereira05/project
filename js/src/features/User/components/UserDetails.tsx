import { type FormEvent, useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Building2, Eye, IdCard, Link as LinkIcon, Mail, Save, Shield, Trophy, User as UserIcon, X } from "lucide-react";
import { api, type UserAssociations, type UserRole, type UserSummary } from "../../auth/api";
import { FileAvatar } from "../../files";
import { assignSponsorUser } from "../../sponsors/api";
import { getInitials } from "../../../shared/utils";
import { roleBadgeColor, roleLabel } from "../utils";

const ROLE_OPTIONS: UserRole[] = ["NORMAL", "SECRETARIA", "ADMIN"];

export default function UserDetails() {
  const { t } = useTranslation();
  const { userId } = useParams();
  const [user, setUser] = useState<UserSummary | null>(null);
  const [associations, setAssociations] = useState<UserAssociations | null>(null);
  const [roleDraft, setRoleDraft] = useState<UserRole>("NORMAL");
  const [memberIdDraft, setMemberIdDraft] = useState("");
  const [sponsorIdDraft, setSponsorIdDraft] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingRole, setIsSavingRole] = useState(false);
  const [isSavingMember, setIsSavingMember] = useState(false);
  const [isSavingSponsor, setIsSavingSponsor] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [feedback, setFeedback] = useState("");

  const parsedUserId = Number(userId);

  const loadUser = useCallback(async () => {
    if (!Number.isFinite(parsedUserId)) {
      setErrorMessage(t("users.details.errors.load"));
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const [userResponse, associationsResponse] = await Promise.all([
        api.users.getById(parsedUserId),
        api.users.getAssociations(parsedUserId),
      ]);
      setUser(userResponse);
      setRoleDraft(userResponse.role as UserRole);
      setAssociations(associationsResponse);
    } catch {
      setErrorMessage(t("users.details.errors.load"));
    } finally {
      setIsLoading(false);
    }
  }, [parsedUserId, t]);

  useEffect(() => {
    let ignore = false;

    loadUser().catch(() => {
      if (!ignore) setErrorMessage(t("users.details.errors.load"));
    });

    return () => {
      ignore = true;
    };
  }, [loadUser, t]);

  const handleRoleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;

    setIsSavingRole(true);
    setErrorMessage("");
    setFeedback("");

    try {
      const updated = await api.users.updateRole(user.userId, roleDraft);
      setUser(updated);
      setFeedback(t("users.details.feedback.roleUpdated"));
    } catch {
      setErrorMessage(t("users.details.errors.updateRole"));
    } finally {
      setIsSavingRole(false);
    }
  };

  const handleMemberSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;

    const memberId = Number(memberIdDraft);
    if (!Number.isInteger(memberId) || memberId <= 0) {
      setErrorMessage(t("users.details.errors.invalidMember"));
      return;
    }

    setIsSavingMember(true);
    setErrorMessage("");
    setFeedback("");

    try {
      const updated = await api.users.updateActiveMember(user.userId, memberId);
      const associationsResponse = await api.users.getAssociations(user.userId);
      setUser(updated);
      setAssociations(associationsResponse);
      setMemberIdDraft("");
      setFeedback(t("users.details.feedback.memberLinked"));
    } catch {
      setErrorMessage(t("users.details.errors.linkMember"));
    } finally {
      setIsSavingMember(false);
    }
  };

  const handleMemberUnlink = async () => {
    if (!user) return;

    setIsSavingMember(true);
    setErrorMessage("");
    setFeedback("");

    try {
      const updated = await api.users.updateActiveMember(user.userId, null);
      const associationsResponse = await api.users.getAssociations(user.userId);
      setUser(updated);
      setAssociations(associationsResponse);
      setFeedback(t("users.details.feedback.memberUnlinked"));
    } catch {
      setErrorMessage(t("users.details.errors.unlinkMember"));
    } finally {
      setIsSavingMember(false);
    }
  };

  const handleSponsorSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;

    const sponsorId = Number(sponsorIdDraft);
    if (!Number.isInteger(sponsorId) || sponsorId <= 0) {
      setErrorMessage(t("users.details.errors.invalidSponsor"));
      return;
    }

    setIsSavingSponsor(true);
    setErrorMessage("");
    setFeedback("");

    try {
      await assignSponsorUser(sponsorId, user.userId);
      const associationsResponse = await api.users.getAssociations(user.userId);
      setAssociations(associationsResponse);
      setSponsorIdDraft("");
      setFeedback(t("users.details.feedback.sponsorLinked"));
    } catch {
      setErrorMessage(t("users.details.errors.linkSponsor"));
    } finally {
      setIsSavingSponsor(false);
    }
  };

  return (
    <main className="admin-users-page">
      <div className="user-page-topbar">
        <Link to="/admin/users" className="user-back-button">
          <ArrowLeft size={18} />
          {t("userPage.actions.back")}
        </Link>
      </div>

      {errorMessage ? <div className="sponsor-feedback sponsor-feedback-error">{errorMessage}</div> : null}
      {feedback ? <div className="sponsor-feedback sponsor-feedback-success">{feedback}</div> : null}

      {isLoading ? (
        <section className="admin-users-panel">
          <div className="sponsor-empty-card">{t("users.details.loading")}</div>
        </section>
      ) : user ? (
        <>
          <section className="user-profile-card">
            <div className="user-profile-banner"></div>
            <div className="user-profile-body">
              <div className="user-profile-main">
                <div className="user-profile-identity">
                  <FileAvatar
                    alt={user.username}
                    className="user-avatar"
                    editable={false}
                    fallback={user.activeMemberId ? { ownerType: "MEMBER", ownerId: user.activeMemberId, kind: "MEMBER_PHOTO" } : undefined}
                    kind="USER_PROFILE_PHOTO"
                    ownerId={user.userId}
                    ownerType="USER"
                  >
                    {getInitials(user.username)}
                  </FileAvatar>
                  <div className="user-profile-title-group">
                    <h1 className="user-profile-title">{user.username}</h1>
                    <p className="user-profile-subtitle">{t("users.details.subtitle")}</p>
                  </div>
                </div>
                <div className="user-badges">
                  <span className={`user-role-badge ${roleBadgeColor(user.role)}`}>{roleLabel(user.role)}</span>
                </div>
              </div>
            </div>
          </section>

          <section className="user-section-card">
            <div className="user-section-header">
              <div className="user-section-icon">
                <UserIcon size={20} />
              </div>
              <div>
                <h2 className="user-section-title">{t("users.details.account")}</h2>
                <p className="user-section-description">{t("users.details.description")}</p>
              </div>
            </div>

            <div className="user-section-body">
              <div className="user-info-grid">
                <div className="user-info-item">
                  <UserIcon size={18} className="user-info-icon" />
                  <div>
                    <p className="user-info-label">{t("userPage.account.username")}</p>
                    <p className="user-info-value">{user.username}</p>
                  </div>
                </div>
                <div className="user-info-item">
                  <Mail size={18} className="user-info-icon" />
                  <div>
                    <p className="user-info-label">{t("userPage.account.email")}</p>
                    <p className="user-info-value-break">{user.email}</p>
                  </div>
                </div>
                <div className="user-info-item">
                  <Shield size={18} className="user-info-icon" />
                  <div>
                    <p className="user-info-label">{t("userPage.account.role")}</p>
                    <form className="admin-user-inline-form" onSubmit={handleRoleSubmit}>
                      <select className="admin-user-select" value={roleDraft} onChange={(event) => setRoleDraft(event.target.value as UserRole)}>
                        {ROLE_OPTIONS.map((role) => (
                          <option key={role} value={role}>
                            {roleLabel(role)}
                          </option>
                        ))}
                      </select>
                      <button className="sponsor-button-primary" disabled={isSavingRole || roleDraft === user.role} type="submit">
                        <Save size={17} />
                        {isSavingRole ? t("members.common.saving") : t("users.details.role.save")}
                      </button>
                    </form>
                  </div>
                </div>
                <div className="user-info-item">
                  <IdCard size={18} className="user-info-icon" />
                  <div>
                    <p className="user-info-label">{t("users.list.columns.activeMember")}</p>
                    <p className="user-info-value">{user.activeMemberId ? `#${user.activeMemberId}` : "-"}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="user-section-card">
            <div className="user-section-header">
              <div className="user-section-icon">
                <LinkIcon size={20} />
              </div>
              <div>
                <h2 className="user-section-title">{t("users.details.associations.title")}</h2>
                <p className="user-section-description">{t("users.details.associations.description")}</p>
              </div>
            </div>

            <div className="admin-user-association-grid">
              <article className="admin-user-association-card">
                <div className="admin-user-association-heading">
                  <IdCard size={19} />
                  <h3>{t("users.details.associations.member")}</h3>
                </div>
                {associations?.member ? (
                  <>
                    <strong>{associations.member.completeName}</strong>
                    <p>{t("users.details.associations.memberMeta", { number: associations.member.memberNumber, status: associations.member.status })}</p>
                    <div className="admin-user-card-actions">
                      <Link className="sponsor-button-secondary" to={`/admin/members/${associations.member.memberId}`}>
                        <Eye size={17} />
                        {t("users.details.associations.viewMember")}
                      </Link>
                      <button className="sponsor-button-secondary" disabled={isSavingMember} type="button" onClick={handleMemberUnlink}>
                        <X size={17} />
                        {t("users.details.associations.unlink")}
                      </button>
                    </div>
                  </>
                ) : (
                  <form className="admin-user-stack-form" onSubmit={handleMemberSubmit}>
                    <p>{t("users.details.associations.noMember")}</p>
                    <input value={memberIdDraft} onChange={(event) => setMemberIdDraft(event.target.value)} placeholder={t("users.details.associations.memberId")} />
                    <button className="sponsor-button-primary" disabled={isSavingMember} type="submit">
                      <LinkIcon size={17} />
                      {isSavingMember ? t("members.common.saving") : t("users.details.associations.linkMember")}
                    </button>
                  </form>
                )}
              </article>

              <article className="admin-user-association-card">
                <div className="admin-user-association-heading">
                  <Trophy size={19} />
                  <h3>{t("users.details.associations.athlete")}</h3>
                </div>
                {associations?.athlete ? (
                  <>
                    <strong>{associations.athlete.teamCategory}</strong>
                    <p>{t("users.details.associations.athleteMeta", { athleteId: associations.athlete.athleteId, season: associations.athlete.season ?? "-" })}</p>
                    <Link className="sponsor-button-secondary" to={`/admin/athletes/${associations.athlete.athleteId}`}>
                      <Eye size={17} />
                      {t("users.details.associations.viewAthlete")}
                    </Link>
                  </>
                ) : (
                  <p>{associations?.member ? t("users.details.associations.noAthlete") : t("users.details.associations.athleteNeedsMember")}</p>
                )}
              </article>

              <article className="admin-user-association-card">
                <div className="admin-user-association-heading">
                  <Building2 size={19} />
                  <h3>{t("users.details.associations.sponsor")}</h3>
                </div>
                {associations?.sponsors.length ? (
                  <div className="admin-user-mini-list">
                    {associations.sponsors.map((sponsor) => (
                      <div key={sponsor.sponsorId}>
                        <strong>{sponsor.name}</strong>
                        <p>{sponsor.email} · {sponsor.nif}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>{t("users.details.associations.noSponsor")}</p>
                )}
                <form className="admin-user-stack-form" onSubmit={handleSponsorSubmit}>
                  <input value={sponsorIdDraft} onChange={(event) => setSponsorIdDraft(event.target.value)} placeholder={t("users.details.associations.sponsorId")} />
                  <button className="sponsor-button-primary" disabled={isSavingSponsor} type="submit">
                    <LinkIcon size={17} />
                    {isSavingSponsor ? t("members.common.saving") : t("users.details.associations.linkSponsor")}
                  </button>
                </form>
              </article>
            </div>
          </section>

        </>
      ) : null}
    </main>
  );
}
