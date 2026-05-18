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
import Header from "../../../shared/components/Header";
import Footer from "../../../shared/components/Footer";
import { useAuth } from "../../../shared/hooks/useAuth";
import { formatDate, getInitials } from "../../../shared/utils";

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
      return "member-status-active";
    case "PENDENTE":
      return "member-status-pending";
    case "INATIVO":
      return "member-status-inactive";
    case "REJEITADO":
      return "member-status-rejected";
  }
}

function PageWrapper({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <main className="member-page">
        <div className="member-detail-container">{children}</div>
      </main>
      <Footer />
    </>
  );
}

export default function AthletePage() {
  const { t } = useTranslation();
  const { athleteId } = useParams();
  const { role } = useAuth();
  const adminView = isAdminLike(role);

  const [publicDto, setPublicDto] = useState<AthleteDetail | null>(null);
  const [adminDto, setAdminDto] = useState<AthleteAdmin | null>(null);
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
          if (!ignore) setAdminDto(response);
        } else {
          const response = await getAthleteDetail(Number(athleteId));
          if (!ignore) setPublicDto(response);
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
  }, [athleteId, adminView]);

  async function handleToggleActive() {
    if (!adminDto) return;
    try {
      const updated = adminDto.active
        ? await deactivateAthlete(adminDto.athleteId)
        : await reactivateAthlete(adminDto.athleteId);
      setAdminDto(updated);
      setFeedback(updated.active ? t("athletes.detail.feedback.reactivated") : t("athletes.detail.feedback.deactivated"));
      setErrorMessage("");
    } catch {
      setErrorMessage(t("athletes.detail.errors.toggle"));
    }
  }

  async function handleApprove() {
    if (!adminDto) return;
    try {
      const today = new Date().toISOString().slice(0, 10);
      const updated = await approveAthlete(adminDto.athleteId, today);
      setAdminDto(updated);
      setFeedback(t("athletes.detail.feedback.approved"));
      setErrorMessage("");
    } catch {
      setErrorMessage(t("athletes.detail.errors.approve"));
    }
  }

  async function handleReject() {
    if (!adminDto) return;
    try {
      const updated = await rejectAthlete(adminDto.athleteId);
      setAdminDto(updated);
      setFeedback(t("athletes.detail.feedback.rejected"));
      setErrorMessage("");
    } catch {
      setErrorMessage(t("athletes.detail.errors.reject"));
    }
  }

  if (isLoading) {
    return (
      <PageWrapper>
        <div className="member-loading-container py-10">
          <div className="member-loading-spinner"></div>
          <p className="member-loading-text">{t("athletes.detail.loading")}</p>
        </div>
      </PageWrapper>
    );
  }

  if (errorMessage && !adminDto && !publicDto) {
    return (
      <PageWrapper>
        <div className="member-alert-error">
          <p className="member-alert-text">{errorMessage}</p>
        </div>
        <Link className="member-btn-back" to="/athletes">
          <ArrowLeft size={16} />
          {t("athletes.common.back")}
        </Link>
      </PageWrapper>
    );
  }

  if (adminView && adminDto) {
    return (
      <PageWrapper>
        {renderAdminContent({
          athlete: adminDto,
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

  if (publicDto) {
    return (
      <PageWrapper>
        {renderPublicContent(publicDto, t)}
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
      <div className="member-topbar">
        <Link to="/athletes" className="member-btn-back">
          <ArrowLeft size={18} />
          {t("athletes.common.back")}
        </Link>
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
              <div className="member-profile-avatar">
                {athlete.photoUrl ? (
                  <img src={athlete.photoUrl} alt={athlete.member.completeName} className="w-full h-full rounded-full object-cover" />
                ) : (
                  getInitials(athlete.member.completeName)
                )}
              </div>
              <div className="member-profile-name-block">
                <h1 className="member-profile-name">{athlete.member.completeName}</h1>
                <p className="member-profile-number">{t("athletes.detail.memberAthlete", { memberNumber: athlete.member.memberNumber, athleteId: athlete.athleteId })}</p>
              </div>
            </div>
            <div className="member-profile-badges">
              <span className={`member-status-badge ${statusColor(athlete.status)}`}>
                {statusLabel(athlete.status, t)}
              </span>
              <span className="member-category-badge">{athlete.teamCategoryLabel}</span>
            </div>
          </div>

          <div className="member-profile-actions">
            {isPending ? (
              <>
                <button className="member-btn-approve" onClick={onApprove} type="button">
                  <CheckCircle2 size={18} />
                  {t("athletes.detail.actions.approve")}
                </button>
                <button className="member-btn-reject" onClick={onReject} type="button">
                  <XCircle size={18} />
                  {t("athletes.detail.actions.reject")}
                </button>
              </>
            ) : (
              <>
                <Link className="member-btn-primary-sm" to={`/athletes/${athlete.athleteId}/edit`}>
                  <PencilLine size={18} />
                  {t("athletes.detail.actions.update")}
                </Link>
                <button
                  className={athlete.active ? "member-btn-reject" : "member-btn-approve"}
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

      <section className="member-section-card">
        <div className="member-section-header">
          <h2 className="member-section-title">{t("athletes.detail.sections.identity")}</h2>
        </div>
        <div className="member-section-body">
          <div className="member-admin-grid">
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

      <section className="member-section-card">
        <div className="member-section-header">
          <h2 className="member-section-title">{t("athletes.detail.sections.documents")}</h2>
        </div>
        <div className="member-section-body">
          <div className="member-admin-grid">
            <Field label="NIF" value={athlete.member.nif} />
            <Field label="NISS" value={athlete.niss} />
            <Field label={t("athletes.fields.healthNumber")} value={athlete.numeroUtente} />
            <Field label="BI / CC / Passaporte" value={athlete.bi} />
            <Field label={t("athletes.fields.biValidity")} value={formatDate(athlete.biExpirationDate)} />
          </div>
        </div>
      </section>

      <section className="member-section-card">
        <div className="member-section-header">
          <h2 className="member-section-title">{t("athletes.detail.sections.address")}</h2>
        </div>
        <div className="member-section-body">
          <div className="member-admin-grid">
            <Field label={t("athletes.fields.address")} value={athlete.member.address} />
            <Field label={t("athletes.fields.city")} value={athlete.member.city} />
            <Field label={t("athletes.fields.postalCode")} value={athlete.member.postalCode} />
          </div>
        </div>
      </section>

      <section className="member-section-card">
        <div className="member-section-header">
          <h2 className="member-section-title">{t("athletes.detail.sections.school")}</h2>
        </div>
        <div className="member-section-body">
          <div className="member-admin-grid">
            <Field label={t("athletes.fields.school")} value={athlete.school ?? t("athletes.common.empty")} />
            <Field label={t("athletes.fields.schoolYear")} value={athlete.schoolYear ?? t("athletes.common.empty")} />
            <Field label={t("athletes.fields.schoolClass")} value={athlete.schoolClass ?? t("athletes.common.empty")} />
            <Field label={t("athletes.fields.lastClub")} value={athlete.lastClub ?? t("athletes.common.empty")} />
            <Field label={t("athletes.fields.season")} value={athlete.season ?? t("athletes.common.empty")} />
          </div>
        </div>
      </section>

      {athlete.guardians.length > 0 && (
        <section className="member-section-card">
          <div className="member-section-header">
            <h2 className="member-section-title">{t("athletes.detail.sections.guardians")}</h2>
          </div>
          <div className="member-section-body">
            <div className="member-form-grid">
              {athlete.guardians.map((g) => (
                <div key={g.guardianId} className="member-privacy-box">
                  <div className="member-privacy-head">
                    <span className="member-privacy-title">{g.name}</span>
                    <span className="member-category-badge">
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
      <div className="member-topbar">
        <Link to={`/athletes/category/${athlete.teamCategoryCode}`} className="member-btn-back">
          <ArrowLeft size={18} />
          {t("athletes.detail.backToCategory")}
        </Link>
      </div>

      <section className="member-section-card">
        <div className="member-profile-cover"></div>
        <div className="member-profile-body">
          <div className="member-profile-header">
            <div className="member-profile-info">
              <div className="member-profile-avatar">
                {athlete.fotoUrl ? (
                  <img src={athlete.fotoUrl} alt={athlete.nome} className="w-full h-full rounded-full object-cover" />
                ) : (
                  getInitials(athlete.nome)
                )}
              </div>
              <div className="member-profile-name-block">
                <h1 className="member-profile-name">{athlete.nome}</h1>
                <p className="member-profile-number">{athlete.teamCategoryLabel}</p>
              </div>
            </div>
            <div className="member-profile-badges">
              <span className="member-category-badge">{athlete.nacionalidade}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="member-section-card">
        <div className="member-section-header">
          <h2 className="member-section-title">{t("athletes.detail.sections.sportsProfile")}</h2>
        </div>
        <div className="member-section-body">
          <div className="member-admin-grid">
            <Field label={t("athletes.fields.number")} value={athlete.numero !== null ? String(athlete.numero) : t("athletes.common.empty")} />
            <Field label={t("athletes.fields.position")} value={athlete.posicao ?? t("athletes.common.empty")} />
            <Field label={t("athletes.fields.age")} value={athlete.idade !== null ? t("athletes.detail.ageValue", { count: athlete.idade }) : t("athletes.common.empty")} />
          </div>
        </div>
      </section>

      {athlete.epocasRepresentadas.length > 0 && (
        <section className="member-section-card">
          <div className="member-section-header">
            <h2 className="member-section-title">{t("athletes.detail.sections.representedSeasons")}</h2>
          </div>
          <div className="member-section-body">
            <div className="flex flex-wrap gap-2">
              {athlete.epocasRepresentadas.map((e) => (
                <span key={e} className="member-category-badge">
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
      <span className="member-field-title-spaced">{label}</span>
      <p className="member-field-value">{value}</p>
    </div>
  );
}
