import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, CheckCircle2, ShieldAlert } from "lucide-react";
import type { MemberFormValues } from "..";

type MemberFormProps = {
  title: string;
  description: string;
  values: MemberFormValues;
  onChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  submitLabel: string;
  isSubmitting: boolean;
  errorMessage: string;
  successMessage: string;
  readonlyIdentity?: boolean;
  showBackendNotice?: boolean;
};

export function MemberForm({
  title,
  description,
  values,
  onChange,
  onSubmit,
  submitLabel,
  isSubmitting,
  errorMessage,
  successMessage,
  readonlyIdentity = false,
}: MemberFormProps) {
  const { t } = useTranslation();
  const [hasReadPrivacyText, setHasReadPrivacyText] = useState(values.privacyAccepted);

  useEffect(() => {
    if (values.privacyAccepted) {
      setHasReadPrivacyText(true);
    }
  }, [values.privacyAccepted]);

  return (
    <div className="member-card-padded">
      <div className="member-card-header">
        <div>
          <h2 className="member-title">{title}</h2>
          <p className="member-desc">{description}</p>
        </div>

        <button onClick={() => window.history.back()} className="member-btn-back">
          <ArrowLeft size={18} />
          {t("members.common.back")}
        </button>
      </div>

      {errorMessage && (
        <div className="member-alert-error">
          <ShieldAlert size={20} className="member-alert-icon-error" />
          <p className="member-alert-text">{errorMessage}</p>
        </div>
      )}

      {successMessage && (
        <div className="member-alert-success">
          <CheckCircle2 size={20} className="member-alert-icon-success" />
          <p className="member-alert-text">{successMessage}</p>
        </div>
      )}

      <form onSubmit={onSubmit} className="member-form-stack">
        <div className="member-form-grid">
          <div className="member-input-group">
            <label className="member-label">{t("members.fields.completeName")}</label>
            <input className="member-input" name="completeName" value={values.completeName} onChange={onChange} disabled={readonlyIdentity} required />
          </div>

          <div className="member-input-group">
            <label className="member-label">{t("members.fields.birthDate")}</label>
            <input type="date" className="member-input" name="birthDate" value={values.birthDate} onChange={onChange} disabled={readonlyIdentity} required />
          </div>

          <div className="member-input-group">
            <label className="member-label">{t("members.fields.email")}</label>
            <input type="email" className="member-input" name="email" value={values.email} onChange={onChange} required />
          </div>

          <div className="member-input-group">
            <label className="member-label">{t("members.fields.phone")}</label>
            <input className="member-input" name="phone" value={values.phone} onChange={onChange} required />
          </div>

          <div className="member-input-group">
            <label className="member-label">{t("members.fields.homePhone")}</label>
            <input className="member-input" name="homePhone" value={values.homePhone} onChange={onChange} />
          </div>

          <div className="member-input-group">
            <label className="member-label">{t("members.fields.nif")}</label>
            <input className="member-input" name="nif" value={values.nif} onChange={onChange} />
          </div>

          <div className="member-input-group">
            <label className="member-label">{t("members.fields.category")}</label>
            <select className="member-input" name="category" value={values.category} onChange={onChange}>
              <option value="SOCIO">{t("members.labels.categories.SOCIO")}</option>
              <option value="ATLETA_SOCIO">{t("members.labels.categories.ATLETA_SOCIO")}</option>
            </select>
          </div>

          <div className="member-input-group">
            <label className="member-label">{t("members.fields.monthlyQuota")}</label>
            <input
              type="number"
              min={1.5}
              step={0.01}
              className="member-input"
              name="membershipQuotaEuros"
              value={values.category === "ATLETA_SOCIO" ? "0.00" : values.membershipQuotaEuros}
              onChange={onChange}
              disabled={values.category === "ATLETA_SOCIO"}
              required={values.category !== "ATLETA_SOCIO"}
            />
            <p className="member-helper-text">{t("members.form.quotaHelp")}</p>
          </div>

          <div className="member-input-group-span">
            <label className="member-label">{t("members.fields.address")}</label>
            <input className="member-input" name="address" value={values.address} onChange={onChange} required />
          </div>

          <div className="member-input-group">
            <label className="member-label">{t("members.fields.postalCode")}</label>
            <input className="member-input" name="postalCode" value={values.postalCode} onChange={onChange} required />
          </div>

          <div className="member-input-group">
            <label className="member-label">{t("members.fields.city")}</label>
            <input className="member-input" name="city" value={values.city} onChange={onChange} required />
          </div>

          <div className="member-input-group-span">
            <label className="member-label">{t("members.fields.billingLocation")}</label>
            <input className="member-input" name="billingLocation" value={values.billingLocation} onChange={onChange} placeholder={t("members.form.billingPlaceholder")} />
          </div>
        </div>

        <div className="member-form-section">
          <label className="member-checkbox-row">
            <div className="member-checkbox-offset">
              <input type="checkbox" className="member-checkbox" name="formerMember" checked={values.formerMember} onChange={onChange} />
            </div>
            <div>
              <span className="member-checkbox-title">{t("members.form.formerMember")}</span>
              <p className="member-helper-text-spaced">{t("members.form.formerMemberHelp")}</p>
            </div>
          </label>

          <div className="member-privacy-box">
            <div className="member-privacy-head">
              <p className="member-privacy-title">{t("members.form.privacyTitle")}</p>
              <button type="button" className="member-link-action" onClick={() => setHasReadPrivacyText(true)}>
                {t("members.form.readPrivacy")}
              </button>
            </div>
            <p className="member-privacy-text">{t("members.form.privacyText")}</p>
          </div>

          <label className="member-checkbox-row">
            <div className="member-checkbox-offset">
              <input type="checkbox" className="member-checkbox" name="privacyAccepted" checked={values.privacyAccepted} onChange={onChange} disabled={!hasReadPrivacyText} />
            </div>
            <div>
              <span className="member-checkbox-title">{t("members.form.privacyConsent")}</span>
              <p className="member-helper-text-spaced">
                {t("members.form.privacyConsentHelp")}
                {!hasReadPrivacyText ? ` ${t("members.form.readPrivacyFirst")}` : ""}
              </p>
            </div>
          </label>

          <label className="member-checkbox-row">
            <div className="member-checkbox-offset">
              <input type="checkbox" className="member-checkbox" name="comsAccepted" checked={values.comsAccepted} onChange={onChange} />
            </div>
            <div>
              <span className="member-checkbox-title">{t("members.form.clubCommunications")}</span>
              <p className="member-helper-text-spaced">{t("members.form.clubCommunicationsHelp")}</p>
            </div>
          </label>
        </div>

        <div className="member-form-actions">
          <button className="member-btn-primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? t("members.common.saving") : submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
