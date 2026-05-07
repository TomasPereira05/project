import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { ArrowLeft, CheckCircle2, ShieldAlert } from "lucide-react";
import type { MemberFormValues } from "..";

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
}: MemberFormProps) {
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
          Voltar
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
            <label className="member-label">Nome completo</label>
            <input
              className="member-input"
              name="completeName"
              value={values.completeName}
              onChange={onChange}
              disabled={readonlyIdentity}
              required
            />
          </div>

          <div className="member-input-group">
            <label className="member-label">Data de nascimento</label>
            <input
              type="date"
              className="member-input"
              name="birthDate"
              value={values.birthDate}
              onChange={onChange}
              disabled={readonlyIdentity}
              required
            />
          </div>

          <div className="member-input-group">
            <label className="member-label">Email</label>
            <input
              type="email"
              className="member-input"
              name="email"
              value={values.email}
              onChange={onChange}
              required
            />
          </div>

          <div className="member-input-group">
            <label className="member-label">Telemóvel</label>
            <input
              className="member-input"
              name="phone"
              value={values.phone}
              onChange={onChange}
              required
            />
          </div>

          <div className="member-input-group">
            <label className="member-label">Telefone de casa</label>
            <input
              className="member-input"
              name="homePhone"
              value={values.homePhone}
              onChange={onChange}
            />
          </div>

          <div className="member-input-group">
            <label className="member-label">NIF</label>
            <input
              className="member-input"
              name="nif"
              value={values.nif}
              onChange={onChange}
            />
          </div>
          
          <div className="member-input-group">
            <label className="member-label">Categoria</label>
            <select 
              className="member-input"
              name="category" 
              value={values.category} 
              onChange={onChange}
            >
              <option value="SOCIO">Sócio</option>
              <option value="ATLETA_SOCIO">Atleta Sócio</option>
            </select>
          </div>

          <div className="member-input-group">
            <label className="member-label">
              Quota mensal (EUR)
            </label>
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
            <p className="member-helper-text">
              Valor minimo para socio: 1,50 EUR. O backend recebe este valor em centimos.
            </p>
          </div>

          <div className="member-input-group-span">
            <label className="member-label">Morada</label>
            <input
              className="member-input"
              name="address"
              value={values.address}
              onChange={onChange}
              required
            />
          </div>

          <div className="member-input-group">
            <label className="member-label">Código postal</label>
            <input
              className="member-input"
              name="postalCode"
              value={values.postalCode}
              onChange={onChange}
              required
            />
          </div>

          <div className="member-input-group">
            <label className="member-label">Cidade</label>
            <input 
              className="member-input"
              name="city" 
              value={values.city} 
              onChange={onChange} 
              required 
            />
          </div>

          <div className="member-input-group-span">
            <label className="member-label">Local de cobrança</label>
            <input
              className="member-input"
              name="billingLocation"
              value={values.billingLocation}
              onChange={onChange}
              placeholder="Ex: Sede do clube"
            />
          </div>
        </div>

        <div className="member-form-section">
            <label className="member-checkbox-row">
            <div className="member-checkbox-offset">
                <input
                    type="checkbox"
                    className="member-checkbox"
                    name="formerMember"
                    checked={values.formerMember}
                    onChange={onChange}
                />
            </div>
            <div>
                <span className="member-checkbox-title">Já foi sócio anteriormente</span>
                <p className="member-helper-text-spaced">
                Ajuda a secretaria a perceber se a inscrição é nova ou uma reentrada.
                </p>
            </div>
            </label>

            <div className="member-privacy-box">
              <div className="member-privacy-head">
                <p className="member-privacy-title">Texto de privacidade obrigatorio</p>
                <button
                  type="button"
                  className="member-link-action"
                  onClick={() => setHasReadPrivacyText(true)}
                >
                  Li o texto
                </button>
              </div>
              <p className="member-privacy-text">
                Os dados pessoais recolhidos neste formulario serao tratados pelo Grupo Desportivo Uniao Ericeirence para efeitos de inscricao como socio do clube, e para envio de comunicacoes relacionadas com a atividade desportiva. Podera exercer, a qualuqer momento o direito de acesso, retificacao, anulacao, oposicao ou eliminacao dos sues dados pessoais, nos casos legalmente admitidos, incluindo a revogacao do consentimento, quando haja lugar. Para tal, devera enviar um pedido ao clube atraves do envio de uma comunicacao. A recolha e processamento dos dados peddoais nao excedera as finalidades acima referidas, que englobam para alem da obrigacao do legal de identificacao do socio o processamento automatico de dados, incluindo a definicao de perfis. O nao fornecimento destes dados inviabiliza a inscricao. Os seus dados pessoais nao serao partilhados com Terceiros, a nao ser mediante o seu consentimento ou do seu representante legal, ou quando exigido por lei ou para responder ao processo legal.
              </p>
            </div>

            <label className="member-checkbox-row">
            <div className="member-checkbox-offset">
                <input
                    type="checkbox"
                    className="member-checkbox"
                    name="privacyAccepted"
                    checked={values.privacyAccepted}
                    onChange={onChange}
                    disabled={!hasReadPrivacyText}
                />
            </div>
            <div>
                <span className="member-checkbox-title">Consentimento de privacidade</span>
                <p className="member-helper-text-spaced">
                  Obrigatorio para submissao e avaliacao do pedido.
                  {!hasReadPrivacyText ? " Leia e confirme o texto acima primeiro." : ""}
                </p>
            </div>
            </label>

            <label className="member-checkbox-row">
            <div className="member-checkbox-offset">
                <input
                    type="checkbox"
                    className="member-checkbox"
                    name="comsAccepted"
                    checked={values.comsAccepted}
                    onChange={onChange}
                />
            </div>
            <div>
                <span className="member-checkbox-title">Comunicações do clube</span>
                <p className="member-helper-text-spaced">Permite receber avisos, eventos e mensagens institucionais.</p>
            </div>
            </label>
        </div>

        <div className="member-form-actions">
          <button 
            className="member-btn-primary" 
            type="submit" 
            disabled={isSubmitting}
          >
            {isSubmitting ? "A guardar..." : submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
