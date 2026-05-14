import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, PencilLine, Shield, User, Wallet, XCircle, ArrowLeft, Building2, MapPin, Mail, Phone, Calendar } from "lucide-react";
import { Link, useParams, Navigate } from "react-router-dom";
import {
  approveMember,
  buildPaymentHistory,
  fetchMember,
  getDebtSummary,
  rejectMember,
  type Member,
} from "..";
import { formatCurrency, formatDate, getInitials } from "../../../shared/utils";
import { useAuth } from "../../../shared/hooks/useAuth";

function statusText(status: Member["status"]) {
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

function statusColor(status: Member["status"]) {
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

export default function MemberPage() {
  const { memberId } = useParams();
  const { role, activeMemberId } = useAuth();

  const [member, setMember] = useState<Member | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const isAdmin = role === "ADMIN" || role === "SECRETARIA";
  const isSelf = activeMemberId === Number(memberId);

  useEffect(() => {
    let ignore = false;

    async function loadMember() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const response = await fetchMember(Number(memberId));
        if (!ignore) {
          setMember(response);
        }
      } catch {
        if (!ignore) {
          setErrorMessage("Não foi possível carregar a ficha do sócio.");
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    if (memberId && (isAdmin || isSelf)) {
      loadMember();
    }

    return () => {
      ignore = true;
    };
  }, [memberId, isAdmin, isSelf]);

  const paymentHistory = useMemo(
    () => (member ? buildPaymentHistory(member) : []),
    [member],
  );
  const debtSummary = useMemo(() => getDebtSummary(paymentHistory), [paymentHistory]);

  async function handleApprove() {
    if (!member) return;

    try {
      const updated = await approveMember(member.memberId);
      setMember(updated);
      setFeedback("Sócio aprovado com sucesso.");
      setErrorMessage("");
    } catch {
      setErrorMessage("Não foi possível aprovar este sócio.");
    }
  }

  async function handleReject() {
    if (!member) return;

    try {
      const updated = await rejectMember(member.memberId);
      setMember(updated);
      setFeedback("Sócio rejeitado com sucesso.");
      setErrorMessage("");
    } catch {
      setErrorMessage("Não foi possível rejeitar este sócio.");
    }
  }

  // RBAC logic
  if (!isAdmin && !isSelf) {
    return <Navigate to="/" replace />;
  }

  if (isLoading) {
    return (
      <>
        <main className="member-page-centered">
          <div className="member-loading-container">
            <div className="member-loading-spinner"></div>
            <p className="member-loading-text">A carregar ficha do sócio...</p>
          </div>
        </main>
      </>
    );
  }

  if (errorMessage && !member) {
    return (
      <>
        <main className="member-page">
          <div className="member-detail-container">
            <div className="member-alert-error">
                {errorMessage}
            </div>
            <button onClick={() => window.history.back()} className="member-btn-back">
              <ArrowLeft size={16} />
              Voltar
            </button>
          </div>
        </main>
      </>
    );
  }

  if (!member) {
    return null;
  }

  return (
    <>
      <main className="member-page">
      <div className="member-detail-container">
        
        {/* TOPBAR */}
        <div className="member-topbar">
          <button onClick={() => window.history.back()} className="member-btn-back">
            <ArrowLeft size={18} />
            Voltar
          </button>
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

        {/* PROFILE HEADER */}
        <section className="member-section-card">
            <div className="member-profile-cover"></div>
            <div className="member-profile-body">
                <div className="member-profile-header">
                    <div className="member-profile-info">
                        <div className="member-profile-avatar">
                            {getInitials(member.completeName)}
                        </div>
                        <div className="member-profile-name-block">
                            <h1 className="member-profile-name">{member.completeName}</h1>
                            <p className="member-profile-number">Sócio #{member.memberNumber}</p>
                        </div>
                    </div>
                    
                    <div className="member-profile-badges">
                        <span className={`member-status-badge ${statusColor(member.status)}`}>
                            {statusText(member.status)}
                        </span>
                        <span className="member-category-badge">
                            {member.category === "ATLETA_SOCIO" ? "Atleta Sócio" : "Sócio"}
                        </span>
                    </div>
                </div>

                <div className="member-inline-meta">
                     <div className="member-inline-meta-item">
                         <MapPin size={16} />
                         <span>{member.city}</span>
                     </div>
                     <div className="member-inline-meta-item">
                         <Calendar size={16} />
                         <span>Membro desde {formatDate(member.registrationDate)}</span>
                     </div>
                </div>

                <div className="member-profile-actions">
                    <Link
                    className="member-btn-primary-sm"
                    to={`/members/${member.memberId}/edit`}
                    >
                    <PencilLine size={18} />
                    Editar Perfil
                    </Link>
                    
                    {isAdmin && member.status === "PENDENTE" && (
                    <>
                        <button className="member-btn-approve" onClick={handleApprove} type="button">
                        <CheckCircle2 size={18} />
                        Aprovar
                        </button>
                        <button className="member-btn-reject" onClick={handleReject} type="button">
                        <XCircle size={18} />
                        Rejeitar
                        </button>
                    </>
                    )}
                </div>
            </div>
        </section>

        {/* ADMIN DETAILS SECTION */}
        {isAdmin && (
            <section className="member-section-card">
                <div className="member-section-header">
                    <div className="member-section-icon">
                        <Shield size={20} />
                    </div>
                    <div>
                        <h2 className="member-section-title">Informação de Administração</h2>
                        <p className="member-section-desc">Dados completos para avaliação e acompanhamento do sócio.</p>
                    </div>
                </div>

                <div className="member-section-body">
                    <div className="member-admin-grid">
                        
                        <div className="member-admin-column">
                            <div className="member-info-row">
                                <Mail size={18} className="member-info-icon" />
                                <div>
                                    <p className="member-field-title">Email</p>
                                    <p className="member-field-value-break">{member.email}</p>
                                </div>
                            </div>
                            <div className="member-info-row">
                                <Phone size={18} className="member-info-icon" />
                                <div>
                                    <p className="member-field-title">Telemóvel</p>
                                    <p className="member-field-value">{member.phone}</p>
                                </div>
                            </div>
                            <div className="member-info-row">
                                <Building2 size={18} className="member-info-icon" />
                                <div>
                                    <p className="member-field-title">Telefone de Casa</p>
                                    <p className="member-field-value">{member.homePhone || "Não indicado"}</p>
                                </div>
                            </div>
                            <div className="member-info-row">
                                <Building2 size={18} className="member-info-icon" />
                                <div>
                                    <p className="member-field-title">NIF</p>
                                    <p className="member-field-value">{member.nif || "Não indicado"}</p>
                                </div>
                            </div>
                        </div>

                        <div className="member-admin-column">
                             <div className="member-info-row">
                                <MapPin size={18} className="member-info-icon" />
                                <div>
                                    <p className="member-field-title">Morada Completa</p>
                                    <p className="member-field-value">{member.address}</p>
                                    <p className="member-helper-text-spaced">{member.postalCode} - {member.city}</p>
                                </div>
                            </div>
                            <div className="member-info-row">
                                <Wallet size={18} className="member-info-icon" />
                                <div>
                                    <p className="member-field-title">Local de Cobrança</p>
                                    <p className="member-field-value">{member.billingLocation || "Não definido"}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="member-admin-footer-grid">
                        <div>
                            <p className="member-field-title-spaced">Aprovação</p>
                            <p className="member-field-value-plain">{member.approvalDate ? formatDate(member.approvalDate) : "Pendente"}</p>
                        </div>
                        <div className="member-admin-footer-wide">
                             <p className="member-field-title-spaced">Consentimentos</p>
                             <div className="member-consent-row">
                                 <span>Privacidade: <span className={member.privacyAccepted ? "member-positive-text" : "member-negative-text"}>{member.privacyAccepted ? "Sim" : "Não"}</span></span>
                                 <span>Comunicações: <span className={member.comsAccepted ? "member-positive-text" : "member-negative-text"}>{member.comsAccepted ? "Sim" : "Não"}</span></span>
                             </div>
                        </div>
                    </div>
                </div>
            </section>
        )}

        {/* FINANCE SECTION */}
        {(isSelf || isAdmin) && (
            <section className="member-section-card">
                <div className="member-section-header-between">
                    <div className="member-section-heading-row">
                        <div className="member-section-icon">
                            <Wallet size={20} />
                        </div>
                        <div>
                            <h2 className="member-section-title">Resumo Financeiro</h2>
                            <p className="member-section-desc">Histórico de quotas e estado de pagamentos.</p>
                        </div>
                    </div>
                </div>

                <div className="member-section-body">
                    <div className="member-finance-grid">
                        <div className="member-finance-card">
                            <p className="member-finance-label">Quota Mensal</p>
                            <p className="member-finance-value">{formatCurrency(member.membershipQuota)}</p>
                        </div>
                        <div className="member-finance-card-danger">
                            <p className="member-finance-label-danger">Quotas em Atraso</p>
                            <p className="member-finance-value-danger">{debtSummary.pendingCount}</p>
                        </div>
                        <div className="member-finance-card-danger">
                            <p className="member-finance-label-danger">Total em Dívida</p>
                            <p className="member-finance-value-danger">{formatCurrency(debtSummary.pendingCents)}</p>
                        </div>
                    </div>

                    <h3 className="member-payment-title">Histórico de Pagamentos</h3>
                    
                    {paymentHistory.length === 0 ? (
                        <div className="member-empty-history">
                            <User size={32} className="member-empty-history-icon" />
                            <p className="member-alert-text">Este sócio não tem quotas para apresentar no histórico.</p>
                        </div>
                    ) : (
                        <div className="member-payment-list">
                            {paymentHistory.map((item) => (
                                <div
                                    className={`member-payment-row ${
                                        item.status === "PENDING" ? "member-payment-row-pending" : "member-payment-row-paid"
                                    }`}
                                    key={item.id}
                                >
                                    <div>
                                        <p className="member-payment-label">{item.label}</p>
                                        <p className="member-helper-text-spaced">
                                            Época {item.season} • Vencimento {formatDate(item.dueDate)}
                                        </p>
                                    </div>

                                    <div className="member-text-right">
                                        <p className={`member-payment-value ${item.status === "PENDING" ? "member-negative-text" : "member-positive-text"}`}>
                                            {formatCurrency(item.amountCents)}
                                        </p>
                                        <p className="member-helper-text-spaced">
                                            {item.status === "PAID"
                                                ? `Pago em ${formatDate(item.paidDate)}`
                                                : "Em atraso"}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        )}
      </div>
      </main>
    </>
  );
}
