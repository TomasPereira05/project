import type { ChangeEvent, FormEvent } from "react";
import { Link } from "react-router-dom";
import type { MemberFormValues } from "../../shared/api/members";

type MemberFormProps = {
  title: string;
  description: string;
  values: MemberFormValues;
  onChange: (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => void;
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
  showBackendNotice = false,
}: MemberFormProps) {
  return (
    <section className="member-form-card">
      <div className="member-form-row">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>

        <Link className="ghost-button" to="/members?viewer=admin">
          Voltar aos socios
        </Link>
      </div>

      {showBackendNotice ? (
        <div className="feedback-message">
          O backend atual permite atualizar contactos e categoria. Os restantes
          campos aparecem aqui para manter o mesmo formulario e facilitar a
          avaliacao da experiencia.
        </div>
      ) : null}

      {errorMessage ? (
        <div className="feedback-message is-error">{errorMessage}</div>
      ) : null}

      {successMessage ? (
        <div className="feedback-message is-success">{successMessage}</div>
      ) : null}

      <form onSubmit={onSubmit}>
        <div className="member-form-grid">
          <label className="member-form-field">
            <span>Nome completo</span>
            <input
              name="completeName"
              value={values.completeName}
              onChange={onChange}
              disabled={readonlyIdentity}
              required
            />
          </label>

          <label className="member-form-field">
            <span>Data de nascimento</span>
            <input
              type="date"
              name="birthDate"
              value={values.birthDate}
              onChange={onChange}
              disabled={readonlyIdentity}
              required
            />
          </label>

          <label className="member-form-field">
            <span>Email</span>
            <input
              type="email"
              name="email"
              value={values.email}
              onChange={onChange}
              required
            />
          </label>

          <label className="member-form-field">
            <span>Telemovel</span>
            <input
              name="phone"
              value={values.phone}
              onChange={onChange}
              required
            />
          </label>

          <label className="member-form-field">
            <span>Telefone de casa</span>
            <input
              name="homePhone"
              value={values.homePhone}
              onChange={onChange}
            />
          </label>

          <label className="member-form-field">
            <span>Categoria</span>
            <select name="category" value={values.category} onChange={onChange}>
              <option value="SOCIO">Socio</option>
              <option value="ATLETA_SOCIO">Atleta socio</option>
            </select>
          </label>

          <label className="member-form-field">
            <span>Morada</span>
            <input
              name="address"
              value={values.address}
              onChange={onChange}
              required
            />
          </label>

          <label className="member-form-field">
            <span>Codigo postal</span>
            <input
              name="postalCode"
              value={values.postalCode}
              onChange={onChange}
              required
            />
          </label>

          <label className="member-form-field">
            <span>Cidade</span>
            <input name="city" value={values.city} onChange={onChange} required />
          </label>

          <label className="member-form-field">
            <span>Local de cobranca</span>
            <input
              name="billingLocation"
              value={values.billingLocation}
              onChange={onChange}
              placeholder="Ex: sede do clube"
            />
          </label>
        </div>

        <label className="member-form-field is-checkbox">
          <input
            type="checkbox"
            name="formerMember"
            checked={values.formerMember}
            onChange={onChange}
          />
          <div>
            <label>Ja foi socio anteriormente</label>
            <span>
              Ajuda a secretaria a perceber se a inscricao e nova ou uma
              reentrada.
            </span>
          </div>
        </label>

        <label className="member-form-field is-checkbox">
          <input
            type="checkbox"
            name="privacyAccepted"
            checked={values.privacyAccepted}
            onChange={onChange}
          />
          <div>
            <label>Consentimento de privacidade</label>
            <span>Obrigatorio para submissao e avaliacao do pedido.</span>
          </div>
        </label>

        <label className="member-form-field is-checkbox">
          <input
            type="checkbox"
            name="comsAccepted"
            checked={values.comsAccepted}
            onChange={onChange}
          />
          <div>
            <label>Comunicacoes do clube</label>
            <span>Permite receber avisos, eventos e mensagens institucionais.</span>
          </div>
        </label>

        <div className="member-form-actions">
          <button className="primary-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "A guardar..." : submitLabel}
          </button>
        </div>
      </form>
    </section>
  );
}
