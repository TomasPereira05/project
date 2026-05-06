import { useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, ShieldAlert } from "lucide-react";
import {
  TEAM_CATEGORIES,
  defaultAthleteRegisterValues,
  labelForCategory,
  submitAthleteRegistration,
  type AthleteRegisterValues,
} from "..";
import Header from "../../../shared/components/Header";
import Footer from "../../../shared/components/Footer";
import { HERO_IMG_SRC } from "../../../shared/config/config";

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
                <h2 className="member-title">Inscrição de atleta</h2>
                <p className="member-desc">
                  Formulário de inscrição. Após submissão, a secretaria recebe
                  notificação para descarregar o dossier e reencaminhá-lo à AFL.
                </p>
              </div>

              <button onClick={() => navigate(-1)} className="member-btn-back">
                <ArrowLeft size={18} />
                Voltar
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
                  Sócio associado
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="member-input-group">
                    <label className="member-label">Número de sócio</label>
                    <input
                      className="member-input"
                      name="memberId"
                      value={values.memberId}
                      onChange={handleChange}
                      placeholder="Ex: 123"
                      required
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="font-heading text-lg text-text-primary uppercase tracking-tight pb-2 border-b border-border">
                  Dados pessoais
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="member-input-group">
                    <label className="member-label">Nacionalidade</label>
                    <input
                      className="member-input"
                      name="nationality"
                      value={values.nationality}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="member-input-group">
                    <label className="member-label">Naturalidade</label>
                    <input
                      className="member-input"
                      name="birthplace"
                      value={values.birthplace}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="member-input-group">
                    <label className="member-label">Data de nascimento</label>
                    <input
                      type="date"
                      className="member-input"
                      name="birthdate"
                      value={values.birthdate}
                      onChange={handleChange}
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
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="member-input-group">
                    <label className="member-label">Telemóvel</label>
                    <input
                      className="member-input"
                      name="phone"
                      value={values.phone}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="member-input-group">
                    <label className="member-label">NIF</label>
                    <input
                      className="member-input"
                      name="nif"
                      value={values.nif}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="member-input-group">
                    <label className="member-label">NISS</label>
                    <input
                      className="member-input"
                      name="niss"
                      value={values.niss}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="member-input-group">
                    <label className="member-label">Nº utente</label>
                    <input
                      className="member-input"
                      name="numeroUtente"
                      value={values.numeroUtente}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="member-input-group">
                    <label className="member-label">BI/CC</label>
                    <input
                      className="member-input"
                      name="bi"
                      value={values.bi}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="member-input-group">
                    <label className="member-label">Validade BI/CC</label>
                    <input
                      type="date"
                      className="member-input"
                      name="biExpirationDate"
                      value={values.biExpirationDate}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="font-heading text-lg text-text-primary uppercase tracking-tight pb-2 border-b border-border">
                  Morada
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="member-input-group md:col-span-2">
                    <label className="member-label">Morada</label>
                    <input
                      className="member-input"
                      name="address"
                      value={values.address}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="member-input-group">
                    <label className="member-label">Código postal</label>
                    <input
                      className="member-input"
                      name="postalCode"
                      value={values.postalCode}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="member-input-group">
                    <label className="member-label">Cidade</label>
                    <input
                      className="member-input"
                      name="city"
                      value={values.city}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="member-input-group md:col-span-2">
                    <label className="member-label">Distrito</label>
                    <input
                      className="member-input"
                      name="state"
                      value={values.state}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="font-heading text-lg text-text-primary uppercase tracking-tight pb-2 border-b border-border">
                  Dados desportivos
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="member-input-group">
                    <label className="member-label">Escalão</label>
                    <select
                      className="member-input"
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
                  </div>
                  <div className="member-input-group">
                    <label className="member-label">Último clube</label>
                    <input
                      className="member-input"
                      name="lastClub"
                      value={values.lastClub}
                      onChange={handleChange}
                      placeholder="Sem clube anterior"
                    />
                  </div>
                  <div className="member-input-group md:col-span-2">
                    <label className="member-label">Época</label>
                    <input
                      className="member-input"
                      name="season"
                      value={values.season}
                      onChange={handleChange}
                      placeholder="Ex: 2025/2026"
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="font-heading text-lg text-text-primary uppercase tracking-tight pb-2 border-b border-border">
                  Dados escolares
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="member-input-group md:col-span-2">
                    <label className="member-label">Escola</label>
                    <input
                      className="member-input"
                      name="school"
                      value={values.school}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="member-input-group">
                    <label className="member-label">Ano</label>
                    <input
                      className="member-input"
                      name="schoolYear"
                      value={values.schoolYear}
                      onChange={handleChange}
                      placeholder="Ex: 8º ano"
                    />
                  </div>
                  <div className="member-input-group">
                    <label className="member-label">Turma</label>
                    <input
                      className="member-input"
                      name="schoolClass"
                      value={values.schoolClass}
                      onChange={handleChange}
                      placeholder="Ex: B"
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="font-heading text-lg text-text-primary uppercase tracking-tight pb-2 border-b border-border">
                  Encarregado de educação
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="member-input-group">
                    <label className="member-label">Nome</label>
                    <input
                      className="member-input"
                      name="guardianName"
                      value={values.guardianName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="member-input-group">
                    <label className="member-label">Relação</label>
                    <select
                      className="member-input"
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
                  </div>
                  <div className="member-input-group">
                    <label className="member-label">Parentesco</label>
                    <input
                      className="member-input"
                      name="guardianKinship"
                      value={values.guardianKinship}
                      onChange={handleChange}
                      placeholder="Ex: Pai, Mãe, Tio"
                    />
                  </div>
                  <div className="member-input-group">
                    <label className="member-label">Email</label>
                    <input
                      type="email"
                      className="member-input"
                      name="guardianEmail"
                      value={values.guardianEmail}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="member-input-group">
                    <label className="member-label">Telemóvel</label>
                    <input
                      className="member-input"
                      name="guardianPhone"
                      value={values.guardianPhone}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="member-input-group">
                    <label className="member-label">Profissão</label>
                    <input
                      className="member-input"
                      name="guardianWork"
                      value={values.guardianWork}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <label className="member-checkbox-group group">
                  <div className="mt-1">
                    <input
                      type="checkbox"
                      className="member-checkbox"
                      name="guardianHasFamilyInClub"
                      checked={values.guardianHasFamilyInClub}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-text-primary group-hover:text-primary transition-colors">
                      Tem familiares no clube
                    </span>
                    <p className="text-xs text-text-secondary mt-0.5">
                      Indica se já existem outros sócios ou atletas da mesma família.
                    </p>
                  </div>
                </label>
              </section>

              <section className="space-y-4 pt-4 border-t border-border">
                <h3 className="font-heading text-lg text-text-primary uppercase tracking-tight pb-2 border-b border-border">
                  Consentimentos
                </h3>

                <label className="member-checkbox-group group">
                  <div className="mt-1">
                    <input
                      type="checkbox"
                      className="member-checkbox"
                      name="privacyAccepted"
                      checked={values.privacyAccepted}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-text-primary group-hover:text-primary transition-colors">
                      Consentimento de privacidade
                    </span>
                    <p className="text-xs text-text-secondary mt-0.5">
                      Obrigatório para submissão e validação da inscrição.
                    </p>
                  </div>
                </label>

                <label className="member-checkbox-group group">
                  <div className="mt-1">
                    <input
                      type="checkbox"
                      className="member-checkbox"
                      name="comsAccepted"
                      checked={values.comsAccepted}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-text-primary group-hover:text-primary transition-colors">
                      Comunicações do clube
                    </span>
                    <p className="text-xs text-text-secondary mt-0.5">
                      Permite receber avisos, eventos e mensagens institucionais.
                    </p>
                  </div>
                </label>

                <label className="member-checkbox-group group">
                  <div className="mt-1">
                    <input
                      type="checkbox"
                      className="member-checkbox"
                      name="schoolCertificationAccepted"
                      checked={values.schoolCertificationAccepted}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-text-primary group-hover:text-primary transition-colors">
                      Certificação escolar
                    </span>
                    <p className="text-xs text-text-secondary mt-0.5">
                      Autoriza o clube a confirmar dados escolares junto da escola.
                    </p>
                  </div>
                </label>
              </section>

              <div className="pt-6 border-t border-border">
                <button
                  className="member-btn-primary"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "A submeter..." : "Submeter inscrição"}
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
