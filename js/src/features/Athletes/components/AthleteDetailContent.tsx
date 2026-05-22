import { type ReactNode } from "react";
import { ArrowLeft, CheckCircle2, PencilLine, XCircle } from "lucide-react";
import { Link } from "react-router-dom";
import type { TFunction } from "i18next";
import type { AthleteAdmin, AthleteDetail } from "../types";
import Header from "../../../shared/components/Header";
import Footer from "../../../shared/components/Footer";
import { formatDate, getInitials } from "../../../shared/utils";
import { statusColor, statusLabel } from "../utils";

export function PageWrapper({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <main className="athlete-page">
        <div className="athlete-detail-container">{children}</div>
      </main>
      <Footer />
    </>
  );
}

export function AthleteAdminDetail({
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
  t: TFunction<"translation", undefined>;
}) {
  const isPending = athlete.status === "PENDENTE";
  return (
    <>
      <div className="athlete-topbar">
        <Link to="/athletes" className="athlete-btn-back">
          <ArrowLeft size={18} />
          {t("athletes.common.back")}
        </Link>
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
              <div className="athlete-profile-avatar">
                {athlete.photoUrl ? (
                  <img src={athlete.photoUrl} alt={athlete.member.completeName} className="w-full h-full rounded-full object-cover" />
                ) : (
                  getInitials(athlete.member.completeName)
                )}
              </div>
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
                <Link className="athlete-btn-primary-sm" to={`/athletes/${athlete.athleteId}/edit`}>
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

export function AthletePublicDetail({
  athlete,
  t,
}: {
  athlete: AthleteDetail;
  t: TFunction<"translation", undefined>;
}) {
  return (
    <>
      <div className="athlete-topbar">
        <Link to={`/athletes/category/${athlete.teamCategoryCode}`} className="athlete-btn-back">
          <ArrowLeft size={18} />
          {t("athletes.detail.backToCategory")}
        </Link>
      </div>

      <section className="athlete-section-card">
        <div className="athlete-profile-cover"></div>
        <div className="athlete-profile-body">
          <div className="athlete-profile-header">
            <div className="athlete-profile-info">
              <div className="athlete-profile-avatar">
                {athlete.fotoUrl ? (
                  <img src={athlete.fotoUrl} alt={athlete.nome} className="w-full h-full rounded-full object-cover" />
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
