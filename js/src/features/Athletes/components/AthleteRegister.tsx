import { useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  TEAM_CATEGORIES,
  defaultAthleteRegisterValues,
  labelForCategory,
  submitAthleteRegistration,
  type AthleteRegisterValues,
} from "..";
import Header from "../../../shared/components/Header";

const GUARDIAN_ROLES: { value: AthleteRegisterValues["guardianRole"]; label: string }[] = [
  { value: "FATHER", label: "Pai" },
  { value: "MOTHER", label: "Mãe" },
  { value: "LEGAL_GUARDIAN", label: "Encarregado legal" },
];

export default function AthleteRegister() {
  const navigate = useNavigate();
  const [values, setValues] = useState<AthleteRegisterValues>(
    defaultAthleteRegisterValues(),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  function handleChange(
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) {
    const target = event.target;
    const nextValue =
      target instanceof HTMLInputElement && target.type === "checkbox"
        ? target.checked
        : target.value;

    setValues((current) => ({
      ...current,
      [target.name]: nextValue,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    if (!values.privacyAccepted) {
      setErrorMessage("É necessário aceitar o consentimento de privacidade.");
      setIsSubmitting(false);
      return;
    }

    try {
      await submitAthleteRegistration(values);
      setSuccessMessage(
        "Pedido de inscrição submetido. A secretaria será notificada para reencaminhar à AFL.",
      );
      setValues(defaultAthleteRegisterValues());
    } catch {
      setErrorMessage("Não foi possível submeter o pedido de inscrição.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Header />
      <main className="athletes-page">
        <div className="athletes-shell">
          <section className="athlete-form-card">
            <div className="athlete-form-row">
              <div>
                <h2>Inscrição de atleta</h2>
                <p>
                  Formulário de inscrição. Após submissão, a secretaria recebe
                  notificação para descarregar o dossier e reencaminhá-lo à AFL.
                </p>
              </div>
              <button className="ghost-button" onClick={() => navigate(-1)}>
                Voltar
              </button>
            </div>

          <div className="feedback-message">
            O endpoint de inscrição ainda não está disponível no backend. Os dados
            ficam guardados em memória e o envio é simulado.
          </div>

          {errorMessage ? (
            <div className="feedback-message is-error">{errorMessage}</div>
          ) : null}

          {successMessage ? (
            <div className="feedback-message is-success">{successMessage}</div>
          ) : null}

          <form onSubmit={handleSubmit}>
            <h3 className="section-title">Sócio associado</h3>
            <div className="athlete-form-grid">
              <label className="athlete-form-field">
                <span>Número de sócio</span>
                <input
                  name="memberId"
                  value={values.memberId}
                  onChange={handleChange}
                  placeholder="Ex: 123"
                  required
                />
              </label>
            </div>

            <h3 className="section-title">Dados pessoais</h3>
            <div className="athlete-form-grid">
              <label className="athlete-form-field">
                <span>Nacionalidade</span>
                <input
                  name="nationality"
                  value={values.nationality}
                  onChange={handleChange}
                  required
                />
              </label>
              <label className="athlete-form-field">
                <span>Naturalidade</span>
                <input
                  name="birthplace"
                  value={values.birthplace}
                  onChange={handleChange}
                  required
                />
              </label>
              <label className="athlete-form-field">
                <span>Data de nascimento</span>
                <input
                  type="date"
                  name="birthdate"
                  value={values.birthdate}
                  onChange={handleChange}
                  required
                />
              </label>
              <label className="athlete-form-field">
                <span>Email</span>
                <input
                  type="email"
                  name="email"
                  value={values.email}
                  onChange={handleChange}
                  required
                />
              </label>
              <label className="athlete-form-field">
                <span>Telemóvel</span>
                <input
                  name="phone"
                  value={values.phone}
                  onChange={handleChange}
                  required
                />
              </label>
              <label className="athlete-form-field">
                <span>NIF</span>
                <input
                  name="nif"
                  value={values.nif}
                  onChange={handleChange}
                  required
                />
              </label>
              <label className="athlete-form-field">
                <span>NISS</span>
                <input name="niss" value={values.niss} onChange={handleChange} />
              </label>
              <label className="athlete-form-field">
                <span>Nº utente</span>
                <input
                  name="numeroUtente"
                  value={values.numeroUtente}
                  onChange={handleChange}
                />
              </label>
              <label className="athlete-form-field">
                <span>BI/CC</span>
                <input
                  name="bi"
                  value={values.bi}
                  onChange={handleChange}
                  required
                />
              </label>
              <label className="athlete-form-field">
                <span>Validade BI/CC</span>
                <input
                  type="date"
                  name="biExpirationDate"
                  value={values.biExpirationDate}
                  onChange={handleChange}
                  required
                />
              </label>
            </div>

            <h3 className="section-title">Morada</h3>
            <div className="athlete-form-grid">
              <label className="athlete-form-field">
                <span>Morada</span>
                <input
                  name="address"
                  value={values.address}
                  onChange={handleChange}
                  required
                />
              </label>
              <label className="athlete-form-field">
                <span>Código postal</span>
                <input
                  name="postalCode"
                  value={values.postalCode}
                  onChange={handleChange}
                  required
                />
              </label>
              <label className="athlete-form-field">
                <span>Cidade</span>
                <input
                  name="city"
                  value={values.city}
                  onChange={handleChange}
                  required
                />
              </label>
              <label className="athlete-form-field">
                <span>Distrito</span>
                <input
                  name="state"
                  value={values.state}
                  onChange={handleChange}
                  required
                />
              </label>
            </div>

            <h3 className="section-title">Dados desportivos</h3>
            <div className="athlete-form-grid">
              <label className="athlete-form-field">
                <span>Escalão</span>
                <select
                  name="teamCategory"
                  value={values.teamCategory}
                  onChange={handleChange}
                >
                  {TEAM_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {labelForCategory(category)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="athlete-form-field">
                <span>Último clube</span>
                <input
                  name="lastClub"
                  value={values.lastClub}
                  onChange={handleChange}
                  placeholder="Sem clube anterior"
                />
              </label>
              <label className="athlete-form-field">
                <span>Época</span>
                <input
                  name="season"
                  value={values.season}
                  onChange={handleChange}
                  placeholder="Ex: 2025/2026"
                />
              </label>
            </div>

            <h3 className="section-title">Dados escolares</h3>
            <div className="athlete-form-grid">
              <label className="athlete-form-field">
                <span>Escola</span>
                <input
                  name="school"
                  value={values.school}
                  onChange={handleChange}
                />
              </label>
              <label className="athlete-form-field">
                <span>Ano</span>
                <input
                  name="schoolYear"
                  value={values.schoolYear}
                  onChange={handleChange}
                  placeholder="Ex: 8º ano"
                />
              </label>
              <label className="athlete-form-field">
                <span>Turma</span>
                <input
                  name="schoolClass"
                  value={values.schoolClass}
                  onChange={handleChange}
                  placeholder="Ex: B"
                />
              </label>
            </div>

            <h3 className="section-title">Encarregado de educação</h3>
            <div className="athlete-form-grid">
              <label className="athlete-form-field">
                <span>Nome</span>
                <input
                  name="guardianName"
                  value={values.guardianName}
                  onChange={handleChange}
                  required
                />
              </label>
              <label className="athlete-form-field">
                <span>Relação</span>
                <select
                  name="guardianRole"
                  value={values.guardianRole}
                  onChange={handleChange}
                >
                  {GUARDIAN_ROLES.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="athlete-form-field">
                <span>Parentesco</span>
                <input
                  name="guardianKinship"
                  value={values.guardianKinship}
                  onChange={handleChange}
                  placeholder="Ex: Pai, Mãe, Tio"
                />
              </label>
              <label className="athlete-form-field">
                <span>Email</span>
                <input
                  type="email"
                  name="guardianEmail"
                  value={values.guardianEmail}
                  onChange={handleChange}
                  required
                />
              </label>
              <label className="athlete-form-field">
                <span>Telemóvel</span>
                <input
                  name="guardianPhone"
                  value={values.guardianPhone}
                  onChange={handleChange}
                  required
                />
              </label>
              <label className="athlete-form-field">
                <span>Profissão</span>
                <input
                  name="guardianWork"
                  value={values.guardianWork}
                  onChange={handleChange}
                />
              </label>
            </div>

            <label className="athlete-form-field is-checkbox">
              <input
                type="checkbox"
                name="guardianHasFamilyInClub"
                checked={values.guardianHasFamilyInClub}
                onChange={handleChange}
              />
              <div>
                <strong>Tem familiares no clube</strong>
                <span>
                  Indica se já existem outros sócios ou atletas da mesma família.
                </span>
              </div>
            </label>

            <h3 className="section-title">Consentimentos</h3>

            <label className="athlete-form-field is-checkbox">
              <input
                type="checkbox"
                name="privacyAccepted"
                checked={values.privacyAccepted}
                onChange={handleChange}
              />
              <div>
                <strong>Consentimento de privacidade</strong>
                <span>Obrigatório para submissão e validação da inscrição.</span>
              </div>
            </label>

            <label className="athlete-form-field is-checkbox">
              <input
                type="checkbox"
                name="comsAccepted"
                checked={values.comsAccepted}
                onChange={handleChange}
              />
              <div>
                <strong>Comunicações do clube</strong>
                <span>Permite receber avisos, eventos e mensagens institucionais.</span>
              </div>
            </label>

            <label className="athlete-form-field is-checkbox">
              <input
                type="checkbox"
                name="schoolCertificationAccepted"
                checked={values.schoolCertificationAccepted}
                onChange={handleChange}
              />
              <div>
                <strong>Certificação escolar</strong>
                <span>
                  Autoriza o clube a confirmar dados escolares junto da escola.
                </span>
              </div>
            </label>

            <div className="athlete-form-actions">
              <button
                className="primary-button"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? "A submeter..." : "Submeter inscrição"}
              </button>
            </div>
          </form>
          </section>
        </div>
      </main>
    </>
  );
}