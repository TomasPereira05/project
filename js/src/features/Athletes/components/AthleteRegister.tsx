import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, ShieldAlert } from "lucide-react";
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
        if (!ignore) setErrorMessage("Não foi possível carregar os escalões.");
      });
    return () => {
      ignore = true;
    };
  }, []);

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
      setErrorMessage("É necessário aceitar o consentimento de privacidade.");
      setIsSubmitting(false);
      return;
    }
    if (!values.teamCategoryId) {
      setErrorMessage("Selecciona um escalão.");
      setIsSubmitting(false);
      return;
    }
    if (values.birthDate && values.birthDate >= todayISO()) {
      setErrorMessage("A data de nascimento tem de ser anterior a hoje.");
      setIsSubmitting(false);
      return;
    }
    if (values.biExpirationDate && values.biExpirationDate <= todayISO()) {
      setErrorMessage("A validade do BI/CC/Passaporte tem de ser posterior a hoje.");
      setIsSubmitting(false);
      return;
    }
    if (values.isSelfRegistration && alreadyHasMember) {
      setErrorMessage(
        "A tua conta já está associada a uma inscrição. Desmarca \"Esta inscrição é para mim\" para inscrever outra pessoa.",
      );
      setIsSubmitting(false);
      return;
    }

    try {
      await createAthlete(toDto(values));
      setSuccessMessage(
        "Inscrição submetida. A secretaria será notificada para validar a ficha junto da AFL.",
      );
      setValues({ ...initialValues, teamCategoryId: values.teamCategoryId });
    } catch (error) {
      const fallback = "Não foi possível submeter o pedido de inscrição.";
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
                  Quem está a ser inscrito
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
                      Esta inscrição é para mim
                    </span>
                    <p className="text-xs text-text-secondary mt-0.5">
                      Marca esta opção se és tu o atleta a ser inscrito. Caso contrário (estás
                      a inscrever um familiar ou outra pessoa), deixa por marcar.
                      {alreadyHasMember && (
                        <>
                          {" "}
                          <span className="font-semibold">
                            Indisponível: a tua conta já está associada a uma inscrição.
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                </label>
              </section>

              <section className="space-y-4">
                <h3 className="font-heading text-lg text-text-primary uppercase tracking-tight pb-2 border-b border-border">
                  Dados pessoais
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="member-input-group md:col-span-2">
                    <label className="member-label">Nome completo</label>
                    <input className="member-input" name="completeName" value={values.completeName} onChange={handleChange} required />
                  </div>
                  <div className="member-input-group">
                    <label className="member-label">Data de nascimento</label>
                    <input type="date" className="member-input" name="birthDate" value={values.birthDate} onChange={handleChange} max={todayISO()} required />
                  </div>
                  <div className="member-input-group">
                    <label className="member-label">Naturalidade</label>
                    <input className="member-input" name="birthplace" value={values.birthplace} onChange={handleChange} required />
                  </div>
                  <div className="member-input-group">
                    <label className="member-label">Nacionalidade</label>
                    <input className="member-input" name="nationality" value={values.nationality} onChange={handleChange} required />
                  </div>
                  <div className="member-input-group">
                    <label className="member-label">NIF</label>
                    <input className="member-input" name="nif" value={values.nif} onChange={handleChange} pattern="\d{9}" minLength={9} maxLength={9} title="9 dígitos" required />
                  </div>
                  <div className="member-input-group">
                    <label className="member-label">BI / CC / Passaporte</label>
                    <input className="member-input" name="bi" value={values.bi} onChange={handleChange} pattern="[A-Za-z0-9]{8}" minLength={8} maxLength={8} title="8 caracteres alfanuméricos" required />
                  </div>
                  <div className="member-input-group">
                    <label className="member-label">Validade BI/CC/Passaporte</label>
                    <input type="date" className="member-input" name="biExpirationDate" value={values.biExpirationDate} onChange={handleChange} min={tomorrowISO()} required />
                  </div>
                  <div className="member-input-group">
                    <label className="member-label">Nº Utente</label>
                    <input className="member-input" name="numeroUtente" value={values.numeroUtente} onChange={handleChange} pattern="\d{9}" minLength={9} maxLength={9} title="9 dígitos" required />
                  </div>
                  <div className="member-input-group">
                    <label className="member-label">NISS</label>
                    <input className="member-input" name="niss" value={values.niss} onChange={handleChange} pattern="\d{11}" minLength={11} maxLength={11} title="11 dígitos" required />
                  </div>
                  <div className="member-input-group">
                    <label className="member-label">Email</label>
                    <input type="email" className="member-input" name="email" value={values.email} onChange={handleChange} required />
                  </div>
                  <div className="member-input-group">
                    <label className="member-label">Telemóvel</label>
                    <input className="member-input" name="phone" value={values.phone} onChange={handleChange} pattern="\d{7,15}" title="7 a 15 dígitos" required />
                  </div>
                  <div className="member-input-group">
                    <label className="member-label">Telefone fixo</label>
                    <input className="member-input" name="homePhone" value={values.homePhone} onChange={handleChange} placeholder="Opcional" />
                  </div>
                  <div className="member-input-group md:col-span-2">
                    <label className="member-label">Foto (URL)</label>
                    <input className="member-input" name="photoUrl" value={values.photoUrl} onChange={handleChange} placeholder="https://..." />
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
                    <input className="member-input" name="address" value={values.address} onChange={handleChange} required />
                  </div>
                  <div className="member-input-group">
                    <label className="member-label">Código postal</label>
                    <input className="member-input" name="postalCode" value={values.postalCode} onChange={handleChange} pattern="\d{4}-\d{3}" title="Formato NNNN-NNN" placeholder="1500-123" required />
                  </div>
                  <div className="member-input-group">
                    <label className="member-label">Cidade</label>
                    <input className="member-input" name="city" value={values.city} onChange={handleChange} required />
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
                    <select className="member-input" name="teamCategoryId" value={values.teamCategoryId} onChange={handleChange} required>
                      <option value="" disabled>Selecciona...</option>
                      {categories.map((c) => (
                        <option key={c.teamId} value={c.teamId}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="member-input-group">
                    <label className="member-label">Último clube</label>
                    <input className="member-input" name="lastClub" value={values.lastClub} onChange={handleChange} placeholder="Sem clube anterior" />
                  </div>
                  <div className="member-input-group md:col-span-2">
                    <label className="member-label">Época</label>
                    <input className="member-input" name="season" value={values.season} onChange={handleChange} placeholder="Ex: 2025/2026" />
                  </div>
                </div>

                <label className="member-checkbox-group group">
                  <div className="mt-1">
                    <input type="checkbox" className="member-checkbox" name="hasFamilyInClub" checked={values.hasFamilyInClub} onChange={handleChange} />
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

              <section className="space-y-4">
                <h3 className="font-heading text-lg text-text-primary uppercase tracking-tight pb-2 border-b border-border">
                  Dados escolares
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="member-input-group md:col-span-2">
                    <label className="member-label">Escola</label>
                    <input className="member-input" name="school" value={values.school} onChange={handleChange} />
                  </div>
                  <div className="member-input-group">
                    <label className="member-label">Ano</label>
                    <input className="member-input" name="schoolYear" value={values.schoolYear} onChange={handleChange} placeholder="Ex: 8º ano" />
                  </div>
                  <div className="member-input-group">
                    <label className="member-label">Turma</label>
                    <input className="member-input" name="schoolClass" value={values.schoolClass} onChange={handleChange} placeholder="Ex: B" />
                  </div>
                </div>
              </section>

              <GuardianSection
                title="Pai"
                fields={[
                  { name: "fatherName", label: "Nome", value: values.fatherName, required: true },
                  { name: "fatherWork", label: "Actividade profissional", value: values.fatherWork, required: true },
                  { name: "fatherPhone", label: "Telemóvel", value: values.fatherPhone, type: "tel", pattern: "\\d{7,15}", required: true },
                  { name: "fatherEmail", label: "Email", value: values.fatherEmail, type: "email", required: true },
                ]}
                onChange={handleChange}
              />

              <GuardianSection
                title="Mãe"
                fields={[
                  { name: "motherName", label: "Nome", value: values.motherName, required: true },
                  { name: "motherWork", label: "Actividade profissional", value: values.motherWork, required: true },
                  { name: "motherPhone", label: "Telemóvel", value: values.motherPhone, type: "tel", pattern: "\\d{7,15}", required: true },
                  { name: "motherEmail", label: "Email", value: values.motherEmail, type: "email", required: true },
                ]}
                onChange={handleChange}
              />

              <GuardianSection
                title="Encarregado de Educação"
                fields={[
                  { name: "lgName", label: "Nome", value: values.lgName, required: true },
                  { name: "lgKinship", label: "Grau de parentesco", value: values.lgKinship, required: true, placeholder: "Ex: Tio, Avó" },
                  { name: "lgEmail", label: "Email", value: values.lgEmail, type: "email", required: true },
                  { name: "lgPhone", label: "Telemóvel", value: values.lgPhone, type: "tel", pattern: "\\d{7,15}", required: true },
                  { name: "lgContactPhone", label: "Telefone de contacto", value: values.lgContactPhone, type: "tel", pattern: "\\d{7,15}", required: true },
                  { name: "lgWork", label: "Actividade profissional", value: values.lgWork, placeholder: "Opcional" },
                  { name: "lgMemberNumber", label: "Nº Sócio (se aplicável)", value: values.lgMemberNumber, type: "number", placeholder: "Opcional" },
                ]}
                onChange={handleChange}
              />

              <section className="space-y-4 pt-4 border-t border-border">
                <h3 className="font-heading text-lg text-text-primary uppercase tracking-tight pb-2 border-b border-border">
                  Consentimentos
                </h3>

                <label className="member-checkbox-group group">
                  <div className="mt-1">
                    <input type="checkbox" className="member-checkbox" name="privacyAccepted" checked={values.privacyAccepted} onChange={handleChange} />
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
                    <input type="checkbox" className="member-checkbox" name="comsAccepted" checked={values.comsAccepted} onChange={handleChange} />
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
                    <input type="checkbox" className="member-checkbox" name="schoolCertificationAccepted" checked={values.schoolCertificationAccepted} onChange={handleChange} />
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
                <button className="member-btn-primary" type="submit" disabled={isSubmitting}>
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
