import { useEffect, useState, type ReactNode } from "react";
import { ArrowLeft, CheckCircle2, PencilLine, XCircle } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  approveAthlete,
  deactivateAthlete,
  getAdminDetail,
  getAthleteDetail,
  reactivateAthlete,
  rejectAthlete,
} from "..";
import type { AthleteAdmin, AthleteDetail, AthleteStatus } from "..";
import { useAuth } from "../../../shared/hooks/useAuth";
import { formatDate, getInitials, todayISO } from "../../../shared/utils";
import AthletePageBackground from "./AthletePageBackground";
import { FileAvatar, FileUploadList } from "../../files/components/FileControls";

function isAdminLike(role?: string) {
  return role === "ADMIN" || role === "SECRETARIA";
}

function statusLabel(status: AthleteStatus, t: (key: string) => string): string {
  switch (status) {
    case "ATIVO":
      return t("athletes.labels.statuses.ATIVO");
    case "PENDENTE":
      return t("athletes.labels.statuses.PENDENTE");
    case "INATIVO":
      return t("athletes.labels.statuses.INATIVO");
    case "REJEITADO":
      return t("athletes.labels.statuses.REJEITADO");
  }
}

function statusColor(status: AthleteStatus): string {
  switch (status) {
    case "ATIVO":
      return "athlete-status-active";
    case "PENDENTE":
      return "athlete-status-pending";
    case "INATIVO":
      return "athlete-status-inactive";
    case "REJEITADO":
      return "athlete-status-rejected";
  }
}

function PageWrapper({ children }: { children: ReactNode }) {
  return (
    <main className="athlete-page">
      <AthletePageBackground />
      <div className="athlete-detail-container">{children}</div>
    </main>
  );
}

export default function AthletePage() {
  const { t } = useTranslation();
  const { athleteId } = useParams();
  const { role } = useAuth();
  const adminView = isAdminLike(role);

  const [publicAthlete, setPublicAthlete] = useState<AthleteDetail | null>(null);
  const [adminAthlete, setAdminAthlete] = useState<AthleteAdmin | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    let ignore = false;

    async function load() {
      if (!athleteId) return;
      setIsLoading(true);
      setErrorMessage("");
      setFeedback("");

      try {
        if (adminView) {
          const response = await getAdminDetail(Number(athleteId));
          if (!ignore) setAdminAthlete(response);
        } else {
          const response = await getAthleteDetail(Number(athleteId));
          if (!ignore) setPublicAthlete(response);
        }
      } catch {
        if (!ignore) setErrorMessage(t("athletes.detail.errors.load"));
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, [athleteId, adminView, t]);

  async function handleToggleActive() {
    if (!adminAthlete) return;
    try {
      const updated = adminAthlete.active
        ? await deactivateAthlete(adminAthlete.athleteId)
        : await reactivateAthlete(adminAthlete.athleteId);
      setAdminAthlete(updated);
      setFeedback(updated.active ? t("athletes.detail.feedback.reactivated") : t("athletes.detail.feedback.deactivated"));
      setErrorMessage("");
    } catch {
      setErrorMessage(t("athletes.detail.errors.toggle"));
    }
  }

  async function handleApprove() {
    if (!adminAthlete) return;
    try {
      const today = todayISO();
      const updated = await approveAthlete(adminAthlete.athleteId, today);
      setAdminAthlete(updated);
      setFeedback(t("athletes.detail.feedback.approved"));
      setErrorMessage("");
    } catch {
      setErrorMessage(t("athletes.detail.errors.approve"));
    }
  }

  async function handleReject() {
    if (!adminAthlete) return;
    try {
      const updated = await rejectAthlete(adminAthlete.athleteId);
      setAdminAthlete(updated);
      setFeedback(t("athletes.detail.feedback.rejected"));
      setErrorMessage("");
    } catch {
      setErrorMessage(t("athletes.detail.errors.reject"));
    }
  }

  if (isLoading) {
    return (
      <PageWrapper>
        <div className="athlete-loading-container py-10">
          <div className="athlete-loading-spinner"></div>
          <p className="athlete-loading-text">{t("athletes.detail.loading")}</p>
        </div>
      </PageWrapper>
    );
  }

  if (errorMessage && !adminAthlete && !publicAthlete) {
    return (
      <PageWrapper>
        <div className="athlete-alert-error">
          <p className="athlete-alert-text">{errorMessage}</p>
        </div>
        <button onClick={() => window.history.back()} className="athlete-btn-back athlete-detail-back">
          <ArrowLeft size={16} />
          {t("athletes.common.back")}
        </button>
      </PageWrapper>
    );
  }

  if (adminView && adminAthlete) {
    return (
      <PageWrapper>
        {renderAdminContent({
          athlete: adminAthlete,
          feedback,
          errorMessage,
          onToggle: handleToggleActive,
          onApprove: handleApprove,
          onReject: handleReject,
          t,
        })}
      </PageWrapper>
    );
  }

  if (publicAthlete) {
    return (
      <PageWrapper>
        {renderPublicContent(publicAthlete, t)}
      </PageWrapper>
    );
  }

  return null;
}

function renderAdminContent({
  athlete,
  feedback,
  errorMessage,
  onToggle,
  onApprove,
  onReject,
  t,
}: {
  athlete: AthleteAdmin;
  feedback: string;
  errorMessage: string;
  onToggle: () => void;
  onApprove: () => void;
  onReject: () => void;
  t: (key: string, options?: Record<string, unknown>) => string;
}) {
  const isPending = athlete.status === "PENDENTE";
  return (
    <>
      <div className="athlete-topbar">
        <button onClick={() => window.history.back()} className="athlete-btn-back athlete-detail-back">
          <ArrowLeft size={18} />
          {t("athletes.common.back")}
        </button>
      </div>

      {feedback && (
        <div className="athlete-alert-success">
          <CheckCircle2 size={20} className="athlete-alert-icon-success" />
          <p className="athlete-alert-text">{feedback}</p>
        </div>
      )}
      {errorMessage && (
        <div className="athlete-alert-error">
          <XCircle size={20} className="athlete-alert-icon-error" />
          <p className="athlete-alert-text">{errorMessage}</p>
        </div>
      )}

      <section className="athlete-section-card">
        <div className="athlete-profile-cover"></div>
        <div className="athlete-profile-body">
          <div className="athlete-profile-header">
            <div className="athlete-profile-info">
              <FileAvatar
                alt={athlete.member.completeName}
                className="athlete-profile-avatar"
                kind="ATHLETE_PHOTO"
                ownerId={athlete.athleteId}
                ownerType="ATHLETE"
                uploadLabel={t("files.actions.changePhoto")}
              >
                {getInitials(athlete.member.completeName)}
              </FileAvatar>
              <div className="athlete-profile-name-block">
                <h1 className="athlete-profile-name">{athlete.member.completeName}</h1>
                <p className="athlete-profile-number">{t("athletes.detail.memberAthlete", { memberNumber: athlete.member.memberNumber, athleteId: athlete.athleteId })}</p>
              </div>
            </div>
            <div className="athlete-profile-badges">
              <span className={`athlete-status-badge ${statusColor(athlete.status)}`}>
                {statusLabel(athlete.status, t)}
              </span>
              <span className="athlete-category-badge">{athlete.teamCategoryLabel}</span>
            </div>
          </div>

          <div className="athlete-profile-actions">
            {isPending ? (
              <>
                <button className="athlete-btn-approve" onClick={onApprove} type="button">
                  <CheckCircle2 size={18} />
                  {t("athletes.detail.actions.approve")}
                </button>
                <button className="athlete-btn-reject" onClick={onReject} type="button">
                  <XCircle size={18} />
                  {t("athletes.detail.actions.reject")}
                </button>
              </>
            ) : (
              <>
                <Link className="athlete-btn-primary-sm" to={`/admin/athletes/${athlete.athleteId}/edit`}>
                  <PencilLine size={18} />
                  {t("athletes.detail.actions.update")}
                </Link>
                <button
                  className={athlete.active ? "athlete-btn-reject" : "athlete-btn-approve"}
                  onClick={onToggle}
                  type="button"
                >
                  {athlete.active ? (
                    <>
                      <XCircle size={18} />
                      {t("athletes.detail.actions.deactivate")}
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={18} />
                      {t("athletes.detail.actions.reactivate")}
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="athlete-section-card">
        <div className="athlete-section-header">
          <h2 className="athlete-section-title">{t("athletes.detail.sections.identity")}</h2>
        </div>
        <div className="athlete-section-body">
          <div className="athlete-admin-grid">
            <Field label={t("athletes.fields.birthDate")} value={formatDate(athlete.member.birthDate)} />
            <Field label={t("athletes.fields.birthplace")} value={athlete.member.birthplace ?? t("athletes.common.empty")} />
            <Field label={t("athletes.fields.nationality")} value={athlete.nationality} />
            <Field label={t("athletes.fields.email")} value={athlete.member.email} />
            <Field label={t("athletes.fields.phone")} value={athlete.member.phone} />
            <Field label={t("athletes.fields.number")} value={athlete.jerseyNumber !== null ? String(athlete.jerseyNumber) : t("athletes.common.notAssigned")} />
            <Field label={t("athletes.fields.position")} value={athlete.position ?? t("athletes.common.notAssignedFemale")} />
          </div>
        </div>
      </section>

      <section className="athlete-section-card">
        <div className="athlete-section-header">
          <h2 className="athlete-section-title">{t("athletes.detail.sections.documents")}</h2>
        </div>
        <div className="athlete-section-body">
          <div className="athlete-admin-grid">
            <Field label="NIF" value={athlete.member.nif} />
            <Field label="NISS" value={athlete.niss} />
            <Field label={t("athletes.fields.healthNumber")} value={athlete.numeroUtente} />
            <Field label="BI / CC / Passaporte" value={athlete.bi} />
            <Field label={t("athletes.fields.biValidity")} value={formatDate(athlete.biExpirationDate)} />
          </div>
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
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

      <section className="athlete-section-card">
        <div className="athlete-section-header">
          <h2 className="athlete-section-title">{t("athletes.detail.sections.address")}</h2>
        </div>
        <div className="athlete-section-body">
          <div className="athlete-admin-grid">
            <Field label={t("athletes.fields.address")} value={athlete.member.address} />
            <Field label={t("athletes.fields.city")} value={athlete.member.city} />
            <Field label={t("athletes.fields.postalCode")} value={athlete.member.postalCode} />
          </div>
        </div>
      </section>

      <section className="athlete-section-card">
        <div className="athlete-section-header">
          <h2 className="athlete-section-title">{t("athletes.detail.sections.school")}</h2>
        </div>
        <div className="athlete-section-body">
          <div className="athlete-admin-grid">
            <Field label={t("athletes.fields.school")} value={athlete.school ?? t("athletes.common.empty")} />
            <Field label={t("athletes.fields.schoolYear")} value={athlete.schoolYear ?? t("athletes.common.empty")} />
            <Field label={t("athletes.fields.schoolClass")} value={athlete.schoolClass ?? t("athletes.common.empty")} />
            <Field label={t("athletes.fields.lastClub")} value={athlete.lastClub ?? t("athletes.common.empty")} />
            <Field label={t("athletes.fields.season")} value={athlete.season ?? t("athletes.common.empty")} />
          </div>
        </div>
      </section>

      {athlete.guardians.length > 0 && (
        <section className="athlete-section-card">
          <div className="athlete-section-header">
            <h2 className="athlete-section-title">{t("athletes.detail.sections.guardians")}</h2>
          </div>
          <div className="athlete-section-body">
            <div className="athlete-form-grid">
              {athlete.guardians.map((g) => (
                <div key={g.guardianId} className="athlete-privacy-box">
                  <div className="athlete-privacy-head">
                    <span className="athlete-privacy-title">{g.name}</span>
                    <span className="athlete-category-badge">
                      {g.role === "FATHER" && t("athletes.guardians.father")}
                      {g.role === "MOTHER" && t("athletes.guardians.mother")}
                      {g.role === "LEGAL_GUARDIAN" && t("athletes.guardians.legalGuardianWithKinship", { kinship: g.kinship ? ` (${g.kinship})` : "" })}
                    </span>
                  </div>
                  <div className="text-sm text-text-secondary space-y-1">
                    <div>{g.email}</div>
                    <div>{g.phone}</div>
                    {g.contactPhone && <div>{t("athletes.guardians.contact", { phone: g.contactPhone })}</div>}
                    {g.professionalActivity && <div>{t("athletes.guardians.activity", { activity: g.professionalActivity })}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

function renderPublicContent(athlete: AthleteDetail, t: (key: string, options?: Record<string, unknown>) => string) {
  return (
    <>
      <div className="athlete-topbar">
        <button onClick={() => window.history.back()} className="athlete-btn-back athlete-detail-back">
          <ArrowLeft size={18} />
          {t("athletes.common.back")}
        </button>
      </div>

      <section className="athlete-section-card">
        <div className="athlete-profile-cover"></div>
        <div className="athlete-profile-body">
          <div className="athlete-profile-header">
            <div className="athlete-profile-info">
              <div className="athlete-profile-avatar">
                {athlete.fotoUrl ? (
                  <img src={athlete.fotoUrl} alt={athlete.nome} className="file-avatar-image" />
                ) : (
                  getInitials(athlete.nome)
                )}
              </div>
              <div className="athlete-profile-name-block">
                <h1 className="athlete-profile-name">{athlete.nome}</h1>
                <p className="athlete-profile-number">{athlete.teamCategoryLabel}</p>
              </div>
            </div>
            <div className="athlete-profile-badges">
              <span className="athlete-category-badge">{athlete.nacionalidade}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="athlete-section-card">
        <div className="athlete-section-header">
          <h2 className="athlete-section-title">{t("athletes.detail.sections.sportsProfile")}</h2>
        </div>
        <div className="athlete-section-body">
          <div className="athlete-admin-grid">
            <Field label={t("athletes.fields.number")} value={athlete.numero !== null ? String(athlete.numero) : t("athletes.common.empty")} />
            <Field label={t("athletes.fields.position")} value={athlete.posicao ?? t("athletes.common.empty")} />
            <Field label={t("athletes.fields.age")} value={athlete.idade !== null ? t("athletes.detail.ageValue", { count: athlete.idade }) : t("athletes.common.empty")} />
          </div>
        </div>
      </section>

      {athlete.epocasRepresentadas.length > 0 && (
        <section className="athlete-section-card">
          <div className="athlete-section-header">
            <h2 className="athlete-section-title">{t("athletes.detail.sections.representedSeasons")}</h2>
          </div>
          <div className="athlete-section-body">
            <div className="flex flex-wrap gap-2">
              {athlete.epocasRepresentadas.map((e) => (
                <span key={e} className="athlete-category-badge">
                  {e}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="athlete-field-title-spaced">{label}</span>
      <p className="athlete-field-value">{value}</p>
    </div>
  );
}
