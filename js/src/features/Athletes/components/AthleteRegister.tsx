import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, ShieldAlert } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  createAthlete,
  fetchAllTeamCategories,
  type AthleteInput,
  type GuardianInput,
  type TeamCatalogCategory,
} from "..";
import Header from "../../../shared/components/Header";
import Footer from "../../../shared/components/Footer";
import { HERO_IMG_SRC } from "../../../shared/config/config";
import { HttpError } from "../../../shared/types/HttpError";
import { useAuth } from "../../../shared/hooks/useAuth";

type RegisterValues = {
  // Dados pessoais (→ Member)
  completeName: string;
  birthDate: string;
  birthplace: string;
  email: string;
  phone: string;
  homePhone: string;
  nif: string;
  // Morada (→ Member)
  address: string;
  postalCode: string;
  city: string;
  // Dados atléticos (→ Athlete)
  nationality: string;
  niss: string;
  numeroUtente: string;
  bi: string;
  biExpirationDate: string;
  photoUrl: string;
  teamCategoryId: string;
  lastClub: string;
  season: string;
  hasFamilyInClub: boolean;
  // Dados escolares (→ Athlete) — opcionais
  school: string;
  schoolYear: string;
  schoolClass: string;
  // Pai — todos obrigatórios
  fatherName: string;
  fatherEmail: string;
  fatherPhone: string;
  fatherWork: string;
  // Mãe — todos obrigatórios
  motherName: string;
  motherEmail: string;
  motherPhone: string;
  motherWork: string;
  // Encarregado de Educação — nome+grau obrigatórios; contactos mantidos como obrigatórios
  lgName: string;
  lgKinship: string;
  lgEmail: string;
  lgPhone: string;
  lgContactPhone: string;
  lgWork: string;
  lgMemberNumber: string;
  // Consentimentos
  privacyAccepted: boolean;
  comsAccepted: boolean;
  schoolCertificationAccepted: boolean;
  // Auto-inscrição (o próprio user é o atleta)
  isSelfRegistration: boolean;
};

const initialValues: RegisterValues = {
  completeName: "",
  birthDate: "",
  birthplace: "",
  email: "",
  phone: "",
  homePhone: "",
  nif: "",
  address: "",
  postalCode: "",
  city: "",
  nationality: "",
  niss: "",
  numeroUtente: "",
  bi: "",
  biExpirationDate: "",
  photoUrl: "",
  teamCategoryId: "",
  lastClub: "",
  season: "",
  hasFamilyInClub: false,
  school: "",
  schoolYear: "",
  schoolClass: "",
  fatherName: "",
  fatherEmail: "",
  fatherPhone: "",
  fatherWork: "",
  motherName: "",
  motherEmail: "",
  motherPhone: "",
  motherWork: "",
  lgName: "",
  lgKinship: "",
  lgEmail: "",
  lgPhone: "",
  lgContactPhone: "",
  lgWork: "",
  lgMemberNumber: "",
  privacyAccepted: false,
  comsAccepted: false,
  schoolCertificationAccepted: false,
  isSelfRegistration: false,
};

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function tomorrowISO(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

function buildGuardians(values: RegisterValues): GuardianInput[] {
  const lgMemberNumber = values.lgMemberNumber.trim();
  return [
    {
      name: values.fatherName,
      role: "FATHER",
      kinship: null,
      email: values.fatherEmail,
      phone: values.fatherPhone,
      professionalActivity: values.fatherWork.trim(),
      contactPhone: null,
    },
    {
      name: values.motherName,
      role: "MOTHER",
      kinship: null,
      email: values.motherEmail,
      phone: values.motherPhone,
      professionalActivity: values.motherWork.trim(),
      contactPhone: null,
    },
    {
      name: values.lgName,
      role: "LEGAL_GUARDIAN",
      kinship: values.lgKinship,
      email: values.lgEmail,
      phone: values.lgPhone,
      professionalActivity: values.lgWork.trim() || null,
      contactPhone: values.lgContactPhone,
      memberNumber: lgMemberNumber ? Number(lgMemberNumber) : null,
    },
  ];
}

function toDto(values: RegisterValues): AthleteInput {
  return {
    completeName: values.completeName,
    birthDate: values.birthDate,
    birthplace: values.birthplace.trim() || null,
    email: values.email,
    phone: values.phone,
    homePhone: values.homePhone.trim() || null,
    address: values.address,
    postalCode: values.postalCode,
    city: values.city,
    nif: values.nif,
    privacyAccepted: values.privacyAccepted,
    comsAccepted: values.comsAccepted,
    nationality: values.nationality,
    niss: values.niss,
    numeroUtente: values.numeroUtente,
    bi: values.bi,
    biExpirationDate: values.biExpirationDate,
    school: values.school.trim() || null,
    schoolYear: values.schoolYear.trim() || null,
    schoolClass: values.schoolClass.trim() || null,
    lastClub: values.lastClub.trim() || null,
    season: values.season.trim() || null,
    teamCategoryId: Number(values.teamCategoryId),
    photoUrl: values.photoUrl.trim() || null,
    hasFamilyInClub: values.hasFamilyInClub,
    schoolCertificationAccepted: values.schoolCertificationAccepted,
    guardians: buildGuardians(values),
    isSelfRegistration: values.isSelfRegistration,
  };
}

export default function AthleteRegister() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const auth = useAuth();
  const alreadyHasMember = auth.activeMemberId != null;
  const [values, setValues] = useState<RegisterValues>(initialValues);
  const [categories, setCategories] = useState<TeamCatalogCategory[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    let ignore = false;
    fetchAllTeamCategories()
      .then((cats) => {
        if (ignore) return;
        const active = cats.filter((c) => c.active);
        setCategories(active);
        if (active.length > 0) {
          setValues((current) =>
            current.teamCategoryId === "" ? { ...current, teamCategoryId: String(active[0].teamId) } : current,
          );
        }
      })
      .catch(() => {
        if (!ignore) setErrorMessage(t("athletes.register.errors.loadCategories"));
      });
    return () => {
      ignore = true;
    };
  }, [t]);

  function handleChange(
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) {
    const target = event.target;
    const nextValue =
      target instanceof HTMLInputElement && target.type === "checkbox"
        ? target.checked
        : target.value;
    setValues((current) => {
      const next = { ...current, [target.name]: nextValue } as RegisterValues;
      // Quando marca "sou eu", pré-preenche email com o do user autenticado (se vazio).
      if (target.name === "isSelfRegistration" && nextValue === true && !current.email && auth.email) {
        next.email = auth.email;
      }
      return next;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    if (!values.privacyAccepted) {
      setErrorMessage(t("athletes.register.errors.privacy"));
      setIsSubmitting(false);
      return;
    }
    if (!values.teamCategoryId) {
      setErrorMessage(t("athletes.register.errors.selectCategory"));
      setIsSubmitting(false);
      return;
    }
    if (values.birthDate && values.birthDate >= todayISO()) {
      setErrorMessage(t("athletes.register.errors.birthDate"));
      setIsSubmitting(false);
      return;
    }
    if (values.biExpirationDate && values.biExpirationDate <= todayISO()) {
      setErrorMessage(t("athletes.register.errors.biValidity"));
      setIsSubmitting(false);
      return;
    }
    if (values.isSelfRegistration && alreadyHasMember) {
      setErrorMessage(
        t("athletes.register.errors.selfAlreadyMember"),
      );
      setIsSubmitting(false);
      return;
    }

    try {
      await createAthlete(toDto(values));
      setSuccessMessage(
        t("athletes.register.success"),
      );
      setValues({ ...initialValues, teamCategoryId: values.teamCategoryId });
    } catch (error) {
      const fallback = t("athletes.register.errors.submit");
      const message = error instanceof HttpError ? error.message || fallback : fallback;
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Header />
      <main className="member-form-page">
        <div
          className="member-form-bg"
          style={{ backgroundImage: `url(${HERO_IMG_SRC})` }}
        />
        <div className="member-form-overlay" />

        <div className="member-form-container">
          <div className="member-card-padded">
            <div className="member-card-header">
              <div>
                <h2 className="member-title">{t("athletes.register.title")}</h2>
                <p className="member-desc">
                  {t("athletes.register.description")}
                </p>
              </div>

              <button onClick={() => navigate(-1)} className="member-btn-back">
                <ArrowLeft size={18} />
                {t("athletes.common.back")}
              </button>
            </div>

            {errorMessage && (
              <div className="member-alert-error">
                <ShieldAlert size={20} className="text-red-500" />
                <p className="text-sm font-medium">{errorMessage}</p>
              </div>
            )}

            {successMessage && (
              <div className="member-alert-success">
                <CheckCircle2 size={20} className="text-green-500" />
                <p className="text-sm font-medium">{successMessage}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              <section className="space-y-4">
                <h3 className="font-heading text-lg text-text-primary uppercase tracking-tight pb-2 border-b border-border">
                  {t("athletes.register.sections.who")}
                </h3>
                <label className="member-checkbox-group group">
                  <div className="mt-1">
                    <input
                      type="checkbox"
                      className="member-checkbox"
                      name="isSelfRegistration"
                      checked={values.isSelfRegistration}
                      onChange={handleChange}
                      disabled={alreadyHasMember}
                    />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-text-primary group-hover:text-primary transition-colors">
                      {t("athletes.register.self.title")}
                    </span>
                    <p className="text-xs text-text-secondary mt-0.5">
                      {t("athletes.register.self.help")}
                      {alreadyHasMember && (
                        <>
                          {" "}
                          <span className="font-semibold">
                            {t("athletes.register.self.unavailable")}
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                </label>
              </section>

              <section className="space-y-4">
                <h3 className="font-heading text-lg text-text-primary uppercase tracking-tight pb-2 border-b border-border">
                  {t("athletes.register.sections.personal")}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="member-input-group md:col-span-2">
                    <label className="member-label">{t("athletes.fields.completeName")}</label>
                    <input className="member-input" name="completeName" value={values.completeName} onChange={handleChange} required />
                  </div>
                  <div className="member-input-group">
                    <label className="member-label">{t("athletes.fields.birthDate")}</label>
                    <input type="date" className="member-input" name="birthDate" value={values.birthDate} onChange={handleChange} max={todayISO()} required />
                  </div>
                  <div className="member-input-group">
                    <label className="member-label">{t("athletes.fields.birthplace")}</label>
                    <input className="member-input" name="birthplace" value={values.birthplace} onChange={handleChange} required />
                  </div>
                  <div className="member-input-group">
                    <label className="member-label">{t("athletes.fields.nationality")}</label>
                    <input className="member-input" name="nationality" value={values.nationality} onChange={handleChange} required />
                  </div>
                  <div className="member-input-group">
                    <label className="member-label">NIF</label>
                    <input className="member-input" name="nif" value={values.nif} onChange={handleChange} pattern="\d{9}" minLength={9} maxLength={9} title={t("athletes.validation.nineDigits")} required />
                  </div>
                  <div className="member-input-group">
                    <label className="member-label">BI / CC / Passaporte</label>
                    <input className="member-input" name="bi" value={values.bi} onChange={handleChange} pattern="[A-Za-z0-9]{8}" minLength={8} maxLength={8} title={t("athletes.validation.eightAlphanumeric")} required />
                  </div>
                  <div className="member-input-group">
                    <label className="member-label">{t("athletes.fields.biValidityFull")}</label>
                    <input type="date" className="member-input" name="biExpirationDate" value={values.biExpirationDate} onChange={handleChange} min={tomorrowISO()} required />
                  </div>
                  <div className="member-input-group">
                    <label className="member-label">{t("athletes.fields.healthNumber")}</label>
                    <input className="member-input" name="numeroUtente" value={values.numeroUtente} onChange={handleChange} pattern="\d{9}" minLength={9} maxLength={9} title={t("athletes.validation.nineDigits")} required />
                  </div>
                  <div className="member-input-group">
                    <label className="member-label">NISS</label>
                    <input className="member-input" name="niss" value={values.niss} onChange={handleChange} pattern="\d{11}" minLength={11} maxLength={11} title={t("athletes.validation.elevenDigits")} required />
                  </div>
                  <div className="member-input-group">
                    <label className="member-label">Email</label>
                    <input type="email" className="member-input" name="email" value={values.email} onChange={handleChange} required />
                  </div>
                  <div className="member-input-group">
                    <label className="member-label">{t("athletes.fields.phone")}</label>
                    <input className="member-input" name="phone" value={values.phone} onChange={handleChange} pattern="\d{7,15}" title={t("athletes.validation.sevenToFifteenDigits")} required />
                  </div>
                  <div className="member-input-group">
                    <label className="member-label">{t("athletes.fields.homePhone")}</label>
                    <input className="member-input" name="homePhone" value={values.homePhone} onChange={handleChange} placeholder={t("athletes.common.optional")} />
                  </div>
                  <div className="member-input-group md:col-span-2">
                    <label className="member-label">{t("athletes.fields.photoUrl")}</label>
                    <input className="member-input" name="photoUrl" value={values.photoUrl} onChange={handleChange} placeholder="https://..." />
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="font-heading text-lg text-text-primary uppercase tracking-tight pb-2 border-b border-border">
                  {t("athletes.detail.sections.address")}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="member-input-group md:col-span-2">
                    <label className="member-label">{t("athletes.fields.address")}</label>
                    <input className="member-input" name="address" value={values.address} onChange={handleChange} required />
                  </div>
                  <div className="member-input-group">
                    <label className="member-label">{t("athletes.fields.postalCode")}</label>
                    <input className="member-input" name="postalCode" value={values.postalCode} onChange={handleChange} pattern="\d{4}-\d{3}" title={t("athletes.validation.postalCode")} placeholder="1500-123" required />
                  </div>
                  <div className="member-input-group">
                    <label className="member-label">{t("athletes.fields.city")}</label>
                    <input className="member-input" name="city" value={values.city} onChange={handleChange} required />
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="font-heading text-lg text-text-primary uppercase tracking-tight pb-2 border-b border-border">
                  {t("athletes.detail.sections.sportsData")}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="member-input-group">
                    <label className="member-label">{t("athletes.fields.category")}</label>
                    <select className="member-input" name="teamCategoryId" value={values.teamCategoryId} onChange={handleChange} required>
                      <option value="" disabled>{t("athletes.common.select")}</option>
                      {categories.map((c) => (
                        <option key={c.teamId} value={c.teamId}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="member-input-group">
                    <label className="member-label">{t("athletes.fields.lastClub")}</label>
                    <input className="member-input" name="lastClub" value={values.lastClub} onChange={handleChange} placeholder={t("athletes.register.placeholders.noPreviousClub")} />
                  </div>
                  <div className="member-input-group md:col-span-2">
                    <label className="member-label">{t("athletes.fields.season")}</label>
                    <input className="member-input" name="season" value={values.season} onChange={handleChange} placeholder={t("athletes.register.placeholders.season")} />
                  </div>
                </div>

                <label className="member-checkbox-group group">
                  <div className="mt-1">
                    <input type="checkbox" className="member-checkbox" name="hasFamilyInClub" checked={values.hasFamilyInClub} onChange={handleChange} />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-text-primary group-hover:text-primary transition-colors">
                      {t("athletes.register.family.title")}
                    </span>
                    <p className="text-xs text-text-secondary mt-0.5">
                      {t("athletes.register.family.help")}
                    </p>
                  </div>
                </label>
              </section>

              <section className="space-y-4">
                <h3 className="font-heading text-lg text-text-primary uppercase tracking-tight pb-2 border-b border-border">
                  {t("athletes.detail.sections.schoolData")}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="member-input-group md:col-span-2">
                    <label className="member-label">{t("athletes.fields.school")}</label>
                    <input className="member-input" name="school" value={values.school} onChange={handleChange} />
                  </div>
                  <div className="member-input-group">
                    <label className="member-label">{t("athletes.fields.schoolYear")}</label>
                    <input className="member-input" name="schoolYear" value={values.schoolYear} onChange={handleChange} placeholder={t("athletes.register.placeholders.schoolYear")} />
                  </div>
                  <div className="member-input-group">
                    <label className="member-label">{t("athletes.fields.schoolClass")}</label>
                    <input className="member-input" name="schoolClass" value={values.schoolClass} onChange={handleChange} placeholder={t("athletes.register.placeholders.schoolClass")} />
                  </div>
                </div>
              </section>

              <GuardianSection
                title={t("athletes.guardians.father")}
                fields={[
                  { name: "fatherName", label: t("athletes.fields.name"), value: values.fatherName, required: true },
                  { name: "fatherWork", label: t("athletes.fields.professionalActivity"), value: values.fatherWork, required: true },
                  { name: "fatherPhone", label: t("athletes.fields.phone"), value: values.fatherPhone, type: "tel", pattern: "\\d{7,15}", required: true },
                  { name: "fatherEmail", label: "Email", value: values.fatherEmail, type: "email", required: true },
                ]}
                onChange={handleChange}
              />

              <GuardianSection
                title={t("athletes.guardians.mother")}
                fields={[
                  { name: "motherName", label: t("athletes.fields.name"), value: values.motherName, required: true },
                  { name: "motherWork", label: t("athletes.fields.professionalActivity"), value: values.motherWork, required: true },
                  { name: "motherPhone", label: t("athletes.fields.phone"), value: values.motherPhone, type: "tel", pattern: "\\d{7,15}", required: true },
                  { name: "motherEmail", label: "Email", value: values.motherEmail, type: "email", required: true },
                ]}
                onChange={handleChange}
              />

              <GuardianSection
                title={t("athletes.guardians.legalGuardian")}
                fields={[
                  { name: "lgName", label: t("athletes.fields.name"), value: values.lgName, required: true },
                  { name: "lgKinship", label: t("athletes.fields.kinship"), value: values.lgKinship, required: true, placeholder: t("athletes.register.placeholders.kinship") },
                  { name: "lgEmail", label: "Email", value: values.lgEmail, type: "email", required: true },
                  { name: "lgPhone", label: t("athletes.fields.phone"), value: values.lgPhone, type: "tel", pattern: "\\d{7,15}", required: true },
                  { name: "lgContactPhone", label: t("athletes.fields.contactPhone"), value: values.lgContactPhone, type: "tel", pattern: "\\d{7,15}", required: true },
                  { name: "lgWork", label: t("athletes.fields.professionalActivity"), value: values.lgWork, placeholder: t("athletes.common.optional") },
                  { name: "lgMemberNumber", label: t("athletes.fields.memberNumberIfApplicable"), value: values.lgMemberNumber, type: "number", placeholder: t("athletes.common.optional") },
                ]}
                onChange={handleChange}
              />

              <section className="space-y-4 pt-4 border-t border-border">
                <h3 className="font-heading text-lg text-text-primary uppercase tracking-tight pb-2 border-b border-border">
                  {t("athletes.register.sections.consents")}
                </h3>

                <label className="member-checkbox-group group">
                  <div className="mt-1">
                    <input type="checkbox" className="member-checkbox" name="privacyAccepted" checked={values.privacyAccepted} onChange={handleChange} />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-text-primary group-hover:text-primary transition-colors">
                      {t("athletes.register.consents.privacy")}
                    </span>
                    <p className="text-xs text-text-secondary mt-0.5">
                      {t("athletes.register.consents.privacyHelp")}
                    </p>
                  </div>
                </label>

                <label className="member-checkbox-group group">
                  <div className="mt-1">
                    <input type="checkbox" className="member-checkbox" name="comsAccepted" checked={values.comsAccepted} onChange={handleChange} />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-text-primary group-hover:text-primary transition-colors">
                      {t("athletes.register.consents.communications")}
                    </span>
                    <p className="text-xs text-text-secondary mt-0.5">
                      {t("athletes.register.consents.communicationsHelp")}
                    </p>
                  </div>
                </label>

                <label className="member-checkbox-group group">
                  <div className="mt-1">
                    <input type="checkbox" className="member-checkbox" name="schoolCertificationAccepted" checked={values.schoolCertificationAccepted} onChange={handleChange} />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-text-primary group-hover:text-primary transition-colors">
                      {t("athletes.register.consents.schoolCertification")}
                    </span>
                    <p className="text-xs text-text-secondary mt-0.5">
                      {t("athletes.register.consents.schoolCertificationHelp")}
                    </p>
                  </div>
                </label>
              </section>

              <div className="pt-6 border-t border-border">
                <button className="member-btn-primary" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? t("athletes.register.submitting") : t("athletes.register.submit")}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

type GuardianField = {
  name: string;
  label: string;
  value: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  pattern?: string;
};

function GuardianSection({
  title,
  fields,
  onChange,
}: {
  title: string;
  fields: GuardianField[];
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
}) {
  return (
    <section className="space-y-4">
      <h3 className="font-heading text-lg text-text-primary uppercase tracking-tight pb-2 border-b border-border">
        {title}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {fields.map((f) => (
          <div key={f.name} className="member-input-group">
            <label className="member-label">{f.label}</label>
            <input
              className="member-input"
              type={f.type ?? "text"}
              name={f.name}
              value={f.value}
              onChange={onChange}
              placeholder={f.placeholder}
              required={f.required}
              pattern={f.pattern}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
