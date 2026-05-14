import { useEffect, useState, type ReactNode } from "react";
import { ArrowLeft, CheckCircle2, PencilLine, XCircle } from "lucide-react";
import { Link, useParams } from "react-router-dom";
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

function statusLabel(status: AthleteStatus): string {
  switch (status) {
    case "ATIVO":
      return "Ativo";
    case "PENDENTE":
      return "Pendente";
    case "INATIVO":
      return "Inativo";
    case "REJEITADO":
      return "Rejeitado";
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
        if (!ignore) setErrorMessage("Não foi possível carregar a ficha do atleta.");
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
      setFeedback(updated.active ? "Atleta reativado com sucesso." : "Atleta desativado.");
      setErrorMessage("");
    } catch {
      setErrorMessage("Não foi possível atualizar o estado do atleta.");
    }
  }

  async function handleApprove() {
    if (!adminDto) return;
    try {
      const today = new Date().toISOString().slice(0, 10);
      const updated = await approveAthlete(adminDto.athleteId, today);
      setAdminDto(updated);
      setFeedback("Inscrição aprovada com sucesso.");
      setErrorMessage("");
    } catch {
      setErrorMessage("Não foi possível aprovar a inscrição.");
    }
  }

  async function handleReject() {
    if (!adminDto) return;
    try {
      const updated = await rejectAthlete(adminDto.athleteId);
      setAdminDto(updated);
      setFeedback("Inscrição rejeitada.");
      setErrorMessage("");
    } catch {
      setErrorMessage("Não foi possível rejeitar a inscrição.");
    }
  }

  if (isLoading) {
    return (
      <PageWrapper>
        <div className="member-loading-container py-10">
          <div className="member-loading-spinner"></div>
          <p className="member-loading-text">A carregar ficha do atleta...</p>
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
          Voltar
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
        })}
      </PageWrapper>
    );
  }

  if (publicDto) {
    return (
      <PageWrapper>
        {renderPublicContent(publicDto)}
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
}: {
  athlete: AthleteAdmin;
  feedback: string;
  errorMessage: string;
  onToggle: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  const isPending = athlete.status === "PENDENTE";
  return (
    <>
      <div className="member-topbar">
        <Link to="/athletes" className="member-btn-back">
          <ArrowLeft size={18} />
          Voltar
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
                <p className="member-profile-number">Sócio #{athlete.member.memberNumber} · Atleta #{athlete.athleteId}</p>
              </div>
            </div>
            <div className="member-profile-badges">
              <span className={`member-status-badge ${statusColor(athlete.status)}`}>
                {statusLabel(athlete.status)}
              </span>
              <span className="member-category-badge">{athlete.teamCategoryLabel}</span>
            </div>
          </div>

          <div className="member-profile-actions">
            {isPending ? (
              <>
                <button className="member-btn-approve" onClick={onApprove} type="button">
                  <CheckCircle2 size={18} />
                  Aprovar
                </button>
                <button className="member-btn-reject" onClick={onReject} type="button">
                  <XCircle size={18} />
                  Rejeitar
                </button>
              </>
            ) : (
              <>
                <Link className="member-btn-primary-sm" to={`/athletes/${athlete.athleteId}/edit`}>
                  <PencilLine size={18} />
                  Atualizar
                </Link>
                <button
                  className={athlete.active ? "member-btn-reject" : "member-btn-approve"}
                  onClick={onToggle}
                  type="button"
                >
                  {athlete.active ? (
                    <>
                      <XCircle size={18} />
                      Desativar
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={18} />
                      Reativar
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
          <h2 className="member-section-title">Identidade</h2>
        </div>
        <div className="member-section-body">
          <div className="member-admin-grid">
            <Field label="Data nascimento" value={formatDate(athlete.member.birthDate)} />
            <Field label="Naturalidade" value={athlete.member.birthplace ?? "—"} />
            <Field label="Nacionalidade" value={athlete.nationality} />
            <Field label="Email" value={athlete.member.email} />
            <Field label="Telemóvel" value={athlete.member.phone} />
            <Field label="Número" value={athlete.jerseyNumber !== null ? String(athlete.jerseyNumber) : "Não atribuído"} />
            <Field label="Posição" value={athlete.position ?? "Não atribuída"} />
          </div>
        </div>
      </section>

      <section className="member-section-card">
        <div className="member-section-header">
          <h2 className="member-section-title">Documentos</h2>
        </div>
        <div className="member-section-body">
          <div className="member-admin-grid">
            <Field label="NIF" value={athlete.member.nif} />
            <Field label="NISS" value={athlete.niss} />
            <Field label="Nº Utente" value={athlete.numeroUtente} />
            <Field label="BI / CC / Passaporte" value={athlete.bi} />
            <Field label="Validade BI" value={formatDate(athlete.biExpirationDate)} />
          </div>
        </div>
      </section>

      <section className="member-section-card">
        <div className="member-section-header">
          <h2 className="member-section-title">Morada</h2>
        </div>
        <div className="member-section-body">
          <div className="member-admin-grid">
            <Field label="Morada" value={athlete.member.address} />
            <Field label="Localidade" value={athlete.member.city} />
            <Field label="Código postal" value={athlete.member.postalCode} />
          </div>
        </div>
      </section>

      <section className="member-section-card">
        <div className="member-section-header">
          <h2 className="member-section-title">Escola</h2>
        </div>
        <div className="member-section-body">
          <div className="member-admin-grid">
            <Field label="Escola" value={athlete.school ?? "—"} />
            <Field label="Ano" value={athlete.schoolYear ?? "—"} />
            <Field label="Turma" value={athlete.schoolClass ?? "—"} />
            <Field label="Último clube" value={athlete.lastClub ?? "—"} />
            <Field label="Época" value={athlete.season ?? "—"} />
          </div>
        </div>
      </section>

      {athlete.guardians.length > 0 && (
        <section className="member-section-card">
          <div className="member-section-header">
            <h2 className="member-section-title">Encarregados</h2>
          </div>
          <div className="member-section-body">
            <div className="member-form-grid">
              {athlete.guardians.map((g) => (
                <div key={g.guardianId} className="member-privacy-box">
                  <div className="member-privacy-head">
                    <span className="member-privacy-title">{g.name}</span>
                    <span className="member-category-badge">
                      {g.role === "FATHER" && "Pai"}
                      {g.role === "MOTHER" && "Mãe"}
                      {g.role === "LEGAL_GUARDIAN" && `EE${g.kinship ? ` (${g.kinship})` : ""}`}
                    </span>
                  </div>
                  <div className="text-sm text-text-secondary space-y-1">
                    <div>{g.email}</div>
                    <div>{g.phone}</div>
                    {g.contactPhone && <div>Contacto: {g.contactPhone}</div>}
                    {g.professionalActivity && <div>Atividade: {g.professionalActivity}</div>}
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

function renderPublicContent(athlete: AthleteDetail) {
  return (
    <>
      <div className="member-topbar">
        <Link to={`/athletes/category/${athlete.teamCategoryCode}`} className="member-btn-back">
          <ArrowLeft size={18} />
          Voltar à categoria
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
          <h2 className="member-section-title">Ficha desportiva</h2>
        </div>
        <div className="member-section-body">
          <div className="member-admin-grid">
            <Field label="Número" value={athlete.numero !== null ? String(athlete.numero) : "—"} />
            <Field label="Posição" value={athlete.posicao ?? "—"} />
            <Field label="Idade" value={athlete.idade !== null ? `${athlete.idade} anos` : "—"} />
          </div>
        </div>
      </section>

      {athlete.epocasRepresentadas.length > 0 && (
        <section className="member-section-card">
          <div className="member-section-header">
            <h2 className="member-section-title">Épocas representadas</h2>
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
