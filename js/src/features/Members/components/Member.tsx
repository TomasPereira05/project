import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, PencilLine, Shield, User, Wallet, XCircle, ArrowLeft, Building2, MapPin, Mail, Phone, Calendar } from "lucide-react";
import { Link, useParams, Navigate } from "react-router-dom";
import {
  approveMember,
  buildPaymentHistory,
  eurosFromCents,
  fetchMember,
  getDebtSummary,
  getInitials,
  rejectMember,
  type Member,
} from "..";
import { formatDate } from "../../../shared/utils";
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
      return "bg-green-100 text-green-800 border-green-200";
    case "PENDENTE":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "INATIVO":
      return "bg-gray-100 text-gray-800 border-gray-200";
    case "REJEITADO":
      return "bg-red-100 text-red-800 border-red-200";
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
        <main className="member-page flex justify-center items-center">
          <div className="flex flex-col items-center gap-3 text-text-secondary">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="font-medium animate-pulse">A carregar ficha do sócio...</p>
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
        <div className="flex justify-between items-center mb-6">
          <button onClick={() => window.history.back()} className="text-text-secondary hover:text-primary transition-colors flex items-center gap-2 text-sm font-semibold uppercase tracking-wide">
            <ArrowLeft size={18} />
            Voltar
          </button>
        </div>

        {feedback && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-md flex items-center gap-3">
                <CheckCircle2 size={20} className="text-green-500" />
                <p className="text-sm font-medium">{feedback}</p>
            </div>
        )}
        {errorMessage && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md flex items-center gap-3">
                <XCircle size={20} className="text-red-500" />
                <p className="text-sm font-medium">{errorMessage}</p>
            </div>
        )}

        {/* PROFILE HEADER */}
        <section className="member-card mb-8">
            <div className="bg-gradient-to-r from-[#001D4A] to-primary h-32"></div>
            <div className="px-6 sm:px-10 pb-8 relative">
                <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-6 -mt-12 sm:-mt-16 mb-6">
                    <div className="flex items-end gap-5">
                        <div className="w-24 h-24 sm:w-32 sm:h-32 bg-white rounded-full flex items-center justify-center text-3xl sm:text-4xl font-heading text-primary border-4 border-white shadow-md">
                            {getInitials(member.completeName)}
                        </div>
                        <div className="pb-2 mt-16 sm:mt-20">
                            <h1 className="font-heading text-2xl sm:text-3xl text-text-primary uppercase tracking-tight">{member.completeName}</h1>
                            <p className="text-text-secondary font-medium mt-1">Sócio #{member.memberNumber}</p>
                        </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 pb-2">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${statusColor(member.status)}`}>
                            {statusText(member.status)}
                        </span>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                            {member.category === "ATLETA_SOCIO" ? "Atleta Sócio" : "Sócio"}
                        </span>
                    </div>
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-text-secondary border-t border-border pt-6 mt-6">
                     <div className="flex items-center gap-2">
                         <MapPin size={16} />
                         <span>{member.city}</span>
                     </div>
                     <div className="flex items-center gap-2">
                         <Calendar size={16} />
                         <span>Membro desde {formatDate(member.registrationDate)}</span>
                     </div>
                </div>

                <div className="mt-8 flex flex-wrap gap-3">
                    <Link
                    className="inline-flex items-center justify-center gap-2 text-sm font-semibold uppercase tracking-wide h-10 px-6 border-2 border-primary bg-primary text-white hover:bg-primary-hover transition-colors rounded-md"
                    to={`/members/${member.memberId}/edit`}
                    >
                    <PencilLine size={18} />
                    Editar Perfil
                    </Link>
                    
                    {isAdmin && member.status === "PENDENTE" && (
                    <>
                        <button className="inline-flex items-center justify-center gap-2 text-sm font-semibold uppercase tracking-wide h-10 px-6 bg-green-600 text-white hover:bg-green-700 transition-colors rounded-md" onClick={handleApprove} type="button">
                        <CheckCircle2 size={18} />
                        Aprovar
                        </button>
                        <button className="inline-flex items-center justify-center gap-2 text-sm font-semibold uppercase tracking-wide h-10 px-6 bg-red-600 text-white hover:bg-red-700 transition-colors rounded-md" onClick={handleReject} type="button">
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
            <section className="member-card mb-8">
                <div className="px-6 py-5 border-b border-border bg-gray-50/50 flex items-center gap-3">
                    <div className="p-2 bg-primary/10 text-primary rounded-lg">
                        <Shield size={20} />
                    </div>
                    <div>
                        <h2 className="font-heading text-xl text-text-primary uppercase tracking-tight">Informação de Administração</h2>
                        <p className="text-xs text-text-secondary mt-1">Dados completos para avaliação e acompanhamento do sócio.</p>
                    </div>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-10">
                        
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <Mail size={18} className="text-text-secondary mt-0.5" />
                                <div>
                                    <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Email</p>
                                    <p className="font-medium text-text-primary mt-1 break-all">{member.email}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Phone size={18} className="text-text-secondary mt-0.5" />
                                <div>
                                    <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Telemóvel</p>
                                    <p className="font-medium text-text-primary mt-1">{member.phone}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Building2 size={18} className="text-text-secondary mt-0.5" />
                                <div>
                                    <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Telefone de Casa</p>
                                    <p className="font-medium text-text-primary mt-1">{member.homePhone || "Não indicado"}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Building2 size={18} className="text-text-secondary mt-0.5" />
                                <div>
                                    <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">NIF</p>
                                    <p className="font-medium text-text-primary mt-1">{member.nif || "Não indicado"}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                             <div className="flex items-start gap-3">
                                <MapPin size={18} className="text-text-secondary mt-0.5" />
                                <div>
                                    <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Morada Completa</p>
                                    <p className="font-medium text-text-primary mt-1">{member.address}</p>
                                    <p className="text-sm text-text-secondary mt-0.5">{member.postalCode} - {member.city}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Wallet size={18} className="text-text-secondary mt-0.5" />
                                <div>
                                    <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Local de Cobrança</p>
                                    <p className="font-medium text-text-primary mt-1">{member.billingLocation || "Não definido"}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-border grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <div>
                            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Aprovação</p>
                            <p className="font-medium text-text-primary">{member.approvalDate ? formatDate(member.approvalDate) : "Pendente"}</p>
                        </div>
                        <div className="col-span-2">
                             <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Consentimentos</p>
                             <div className="flex gap-4 font-medium text-text-primary">
                                 <span>Privacidade: <span className={member.privacyAccepted ? "text-green-600" : "text-red-500"}>{member.privacyAccepted ? "Sim" : "Não"}</span></span>
                                 <span>Comunicações: <span className={member.comsAccepted ? "text-green-600" : "text-red-500"}>{member.comsAccepted ? "Sim" : "Não"}</span></span>
                             </div>
                        </div>
                    </div>
                </div>
            </section>
        )}

        {/* FINANCE SECTION */}
        {(isSelf || isAdmin) && (
            <section className="member-card mb-8">
                <div className="px-6 py-5 border-b border-border bg-gray-50/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 text-primary rounded-lg">
                            <Wallet size={20} />
                        </div>
                        <div>
                            <h2 className="font-heading text-xl text-text-primary uppercase tracking-tight">Resumo Financeiro</h2>
                            <p className="text-xs text-text-secondary mt-1">Histórico de quotas e estado de pagamentos.</p>
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                        <div className="bg-muted/30 border border-border p-4 rounded-lg text-center">
                            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Quota Mensal</p>
                            <p className="text-3xl font-heading text-primary tracking-tight">{eurosFromCents(member.membershipQuota)}</p>
                        </div>
                        <div className="bg-red-50/50 border border-red-100 p-4 rounded-lg text-center">
                            <p className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-2">Quotas em Atraso</p>
                            <p className="text-3xl font-heading text-red-600 tracking-tight">{debtSummary.pendingCount}</p>
                        </div>
                        <div className="bg-red-50/50 border border-red-100 p-4 rounded-lg text-center">
                            <p className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-2">Total em Dívida</p>
                            <p className="text-3xl font-heading text-red-600 tracking-tight">{eurosFromCents(debtSummary.pendingCents)}</p>
                        </div>
                    </div>

                    <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-4 border-b border-border pb-2">Histórico de Pagamentos</h3>
                    
                    {paymentHistory.length === 0 ? (
                        <div className="py-10 text-center flex flex-col items-center justify-center text-text-secondary">
                            <User size={32} className="mb-3 opacity-20" />
                            <p className="text-sm font-medium">Este sócio não tem quotas para apresentar no histórico.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {paymentHistory.map((item) => (
                                <div
                                    className={`flex justify-between items-center p-4 rounded-lg border ${
                                        item.status === "PENDING" ? "bg-red-50/30 border-red-100" : "bg-green-50/30 border-green-100"
                                    }`}
                                    key={item.id}
                                >
                                    <div>
                                        <p className="font-semibold text-text-primary">{item.label}</p>
                                        <p className="text-xs text-text-secondary mt-0.5">
                                            Época {item.season} • Vencimento {formatDate(item.dueDate)}
                                        </p>
                                    </div>

                                    <div className="text-right">
                                        <p className={`font-bold ${item.status === "PENDING" ? "text-red-600" : "text-green-600"}`}>
                                            {eurosFromCents(item.amountCents)}
                                        </p>
                                        <p className="text-xs text-text-secondary mt-0.5">
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
