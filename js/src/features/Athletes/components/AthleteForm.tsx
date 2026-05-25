import { type ChangeEvent, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, CheckCircle2, ShieldAlert } from "lucide-react";
import type { RegisterValues, TeamCatalogCategory } from "..";
import { todayISO, tomorrowISO } from "../../../shared/utils";

type AthleteFormProps = {
  title: string;
  description: string;
  submitLabel: string;
  values: RegisterValues;
  categories: TeamCatalogCategory[];
  alreadyHasMember: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isSubmitting: boolean;
  errorMessage: string;
  successMessage: string;
};

export function AthleteForm({
  title,
  description,
  submitLabel,
  values,
  categories,
  alreadyHasMember,
  onChange,
  onSubmit,
  isSubmitting,
  errorMessage,
  successMessage,
}: AthleteFormProps) {
  const { t } = useTranslation();

  return (
    <div className="athlete-card-padded">
      <div className="athlete-card-header">
        <div>
          <h2 className="athlete-title">{title}</h2>
          <p className="athlete-desc">{description}</p>
        </div>

        <button onClick={() => window.history.back()} className="athlete-btn-back">
          <ArrowLeft size={18} />
          {t("athletes.common.back")}
        </button>
      </div>

      {errorMessage && (
        <div className="athlete-alert-error">
          <ShieldAlert size={20} className="text-red-500" />
          <p className="text-sm font-medium">{errorMessage}</p>
        </div>
      )}

      {successMessage && (
        <div className="athlete-alert-success">
          <CheckCircle2 size={20} className="text-green-500" />
          <p className="text-sm font-medium">{successMessage}</p>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-8">
        <section className="space-y-4">
          <h3 className="font-heading text-lg text-text-primary uppercase tracking-tight pb-2 border-b border-border">
            {t("athletes.register.sections.who")}
          </h3>
          <label className="athlete-checkbox-group group">
            <div className="mt-1">
              <input
                type="checkbox"
                className="athlete-checkbox"
                name="isSelfRegistration"
                checked={values.isSelfRegistration}
                onChange={onChange}
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
            <div className="athlete-input-group md:col-span-2">
              <label className="athlete-label">{t("athletes.fields.completeName")}</label>
              <input className="athlete-input" name="completeName" value={values.completeName} onChange={onChange} required />
            </div>
            <div className="athlete-input-group">
              <label className="athlete-label">{t("athletes.fields.birthDate")}</label>
              <input type="date" className="athlete-input" name="birthDate" value={values.birthDate} onChange={onChange} max={todayISO()} required />
            </div>
            <div className="athlete-input-group">
              <label className="athlete-label">{t("athletes.fields.birthplace")}</label>
              <input className="athlete-input" name="birthplace" value={values.birthplace} onChange={onChange} required />
            </div>
            <div className="athlete-input-group">
              <label className="athlete-label">{t("athletes.fields.nationality")}</label>
              <input className="athlete-input" name="nationality" value={values.nationality} onChange={onChange} required />
            </div>
            <div className="athlete-input-group">
              <label className="athlete-label">NIF</label>
              <input className="athlete-input" name="nif" value={values.nif} onChange={onChange} pattern="\d{9}" minLength={9} maxLength={9} title={t("athletes.validation.nineDigits")} required />
            </div>
            <div className="athlete-input-group">
              <label className="athlete-label">BI / CC / Passaporte</label>
              <input className="athlete-input" name="bi" value={values.bi} onChange={onChange} pattern="[A-Za-z0-9]{8}" minLength={8} maxLength={8} title={t("athletes.validation.eightAlphanumeric")} required />
            </div>
            <div className="athlete-input-group">
              <label className="athlete-label">{t("athletes.fields.biValidityFull")}</label>
              <input type="date" className="athlete-input" name="biExpirationDate" value={values.biExpirationDate} onChange={onChange} min={tomorrowISO()} required />
            </div>
            <div className="athlete-input-group">
              <label className="athlete-label">{t("athletes.fields.healthNumber")}</label>
              <input className="athlete-input" name="numeroUtente" value={values.numeroUtente} onChange={onChange} pattern="\d{9}" minLength={9} maxLength={9} title={t("athletes.validation.nineDigits")} required />
            </div>
            <div className="athlete-input-group">
              <label className="athlete-label">NISS</label>
              <input className="athlete-input" name="niss" value={values.niss} onChange={onChange} pattern="\d{11}" minLength={11} maxLength={11} title={t("athletes.validation.elevenDigits")} required />
            </div>
            <div className="athlete-input-group">
              <label className="athlete-label">Email</label>
              <input type="email" className="athlete-input" name="email" value={values.email} onChange={onChange} required />
            </div>
            <div className="athlete-input-group">
              <label className="athlete-label">{t("athletes.fields.phone")}</label>
              <input className="athlete-input" name="phone" value={values.phone} onChange={onChange} pattern="\d{7,15}" title={t("athletes.validation.sevenToFifteenDigits")} required />
            </div>
            <div className="athlete-input-group">
              <label className="athlete-label">{t("athletes.fields.homePhone")}</label>
              <input className="athlete-input" name="homePhone" value={values.homePhone} onChange={onChange} placeholder={t("athletes.common.optional")} />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="font-heading text-lg text-text-primary uppercase tracking-tight pb-2 border-b border-border">
            {t("athletes.detail.sections.address")}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="athlete-input-group md:col-span-2">
              <label className="athlete-label">{t("athletes.fields.address")}</label>
              <input className="athlete-input" name="address" value={values.address} onChange={onChange} required />
            </div>
            <div className="athlete-input-group">
              <label className="athlete-label">{t("athletes.fields.postalCode")}</label>
              <input className="athlete-input" name="postalCode" value={values.postalCode} onChange={onChange} pattern="\d{4}-\d{3}" title={t("athletes.validation.postalCode")} placeholder="1500-123" required />
            </div>
            <div className="athlete-input-group">
              <label className="athlete-label">{t("athletes.fields.city")}</label>
              <input className="athlete-input" name="city" value={values.city} onChange={onChange} required />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="font-heading text-lg text-text-primary uppercase tracking-tight pb-2 border-b border-border">
            {t("athletes.detail.sections.sportsData")}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="athlete-input-group">
              <label className="athlete-label">{t("athletes.fields.category")}</label>
              <select className="athlete-input" name="teamCategoryId" value={values.teamCategoryId} onChange={onChange} required>
                <option value="" disabled>{t("athletes.common.select")}</option>
                {categories.map((c) => (
                  <option key={c.teamId} value={c.teamId}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="athlete-input-group">
              <label className="athlete-label">{t("athletes.fields.lastClub")}</label>
              <input className="athlete-input" name="lastClub" value={values.lastClub} onChange={onChange} placeholder={t("athletes.register.placeholders.noPreviousClub")} />
            </div>
            <div className="athlete-input-group md:col-span-2">
              <label className="athlete-label">{t("athletes.fields.season")}</label>
              <input className="athlete-input" name="season" value={values.season} onChange={onChange} placeholder={t("athletes.register.placeholders.season")} />
            </div>
          </div>

          <label className="athlete-checkbox-group group">
            <div className="mt-1">
              <input type="checkbox" className="athlete-checkbox" name="hasFamilyInClub" checked={values.hasFamilyInClub} onChange={onChange} />
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
            <div className="athlete-input-group md:col-span-2">
              <label className="athlete-label">{t("athletes.fields.school")}</label>
              <input className="athlete-input" name="school" value={values.school} onChange={onChange} />
            </div>
            <div className="athlete-input-group">
              <label className="athlete-label">{t("athletes.fields.schoolYear")}</label>
              <input className="athlete-input" name="schoolYear" value={values.schoolYear} onChange={onChange} placeholder={t("athletes.register.placeholders.schoolYear")} />
            </div>
            <div className="athlete-input-group">
              <label className="athlete-label">{t("athletes.fields.schoolClass")}</label>
              <input className="athlete-input" name="schoolClass" value={values.schoolClass} onChange={onChange} placeholder={t("athletes.register.placeholders.schoolClass")} />
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
          onChange={onChange}
        />

        <GuardianSection
          title={t("athletes.guardians.mother")}
          fields={[
            { name: "motherName", label: t("athletes.fields.name"), value: values.motherName, required: true },
            { name: "motherWork", label: t("athletes.fields.professionalActivity"), value: values.motherWork, required: true },
            { name: "motherPhone", label: t("athletes.fields.phone"), value: values.motherPhone, type: "tel", pattern: "\\d{7,15}", required: true },
            { name: "motherEmail", label: "Email", value: values.motherEmail, type: "email", required: true },
          ]}
          onChange={onChange}
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
          onChange={onChange}
        />

        <section className="space-y-4 pt-4 border-t border-border">
          <h3 className="font-heading text-lg text-text-primary uppercase tracking-tight pb-2 border-b border-border">
            {t("athletes.register.sections.consents")}
          </h3>

          <label className="athlete-checkbox-group group">
            <div className="mt-1">
              <input type="checkbox" className="athlete-checkbox" name="privacyAccepted" checked={values.privacyAccepted} onChange={onChange} />
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

          <label className="athlete-checkbox-group group">
            <div className="mt-1">
              <input type="checkbox" className="athlete-checkbox" name="comsAccepted" checked={values.comsAccepted} onChange={onChange} />
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

          <label className="athlete-checkbox-group group">
            <div className="mt-1">
              <input type="checkbox" className="athlete-checkbox" name="schoolCertificationAccepted" checked={values.schoolCertificationAccepted} onChange={onChange} />
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
          <button className="athlete-btn-primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? t("athletes.register.submitting") : submitLabel}
          </button>
        </div>
      </form>
    </div>
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
          <div key={f.name} className="athlete-input-group">
            <label className="athlete-label">{f.label}</label>
            <input
              className="athlete-input"
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
