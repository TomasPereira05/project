import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, PencilLine, Shield, User, Wallet, XCircle } from "lucide-react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import "../styles/Members.css";
import {
  approveMember,
  buildPaymentHistory,
  eurosFromCents,
  fetchMember,
  formatDate,
  getDebtSummary,
  getInitials,
  getViewerMode,
  rejectMember,
  type Member,
} from "..";

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

export default function MemberPage() {
  const { memberId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const viewer = getViewerMode(location.search);
  const [member, setMember] = useState<Member | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

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
          setErrorMessage("Nao foi possivel carregar a ficha do socio.");
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    if (memberId) {
      loadMember();
    }

    return () => {
      ignore = true;
    };
  }, [memberId]);

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
      setFeedback("Socio aprovado com sucesso.");
      setErrorMessage("");
    } catch {
      setErrorMessage("Nao foi possivel aprovar este socio.");
    }
  }

  async function handleReject() {
    if (!member) return;

    try {
      const updated = await rejectMember(member.memberId);
      setMember(updated);
      setFeedback("Socio rejeitado com sucesso.");
      setErrorMessage("");
    } catch {
      setErrorMessage("Nao foi possivel rejeitar este socio.");
    }
  }

  if (isLoading) {
    return (
      <main className="members-page">
        <div className="members-shell">
          <p>A carregar ficha do socio...</p>
        </div>
      </main>
    );
  }

  if (errorMessage && !member) {
    return (
      <main className="members-page">
        <div className="members-shell">
          <div className="feedback-message is-error">{errorMessage}</div>
          <Link className="secondary-button" to="/members?viewer=admin">
            Voltar
          </Link>
        </div>
      </main>
    );
  }

  if (!member) {
    return null;
  }

  const isAdmin = viewer === "admin";
  const isSelf = viewer === "self";

  return (
    <main className="members-page">
      <div className="members-shell">
        <div className="member-toolbar">
          <Link className="ghost-button" to={`/members?viewer=${viewer}`}>
            Voltar a lista
          </Link>

          <div className="members-viewer">
            <span>Ver como:</span>
            <button
              className={viewer === "admin" ? "is-active" : "ghost-button"}
              onClick={() => navigate(`/members/${member.memberId}?viewer=admin`)}
              type="button"
            >
              Admin
            </button>
            <button
              className={viewer === "self" ? "is-active" : "ghost-button"}
              onClick={() => navigate(`/members/${member.memberId}?viewer=self`)}
              type="button"
            >
              O proprio socio
            </button>
            <button
              className={viewer === "public" ? "is-active" : "ghost-button"}
              onClick={() => navigate(`/members/${member.memberId}?viewer=public`)}
              type="button"
            >
              Utilizador normal
            </button>
          </div>
        </div>

        {feedback ? <div className="feedback-message is-success">{feedback}</div> : null}
        {errorMessage ? (
          <div className="feedback-message is-error">{errorMessage}</div>
        ) : null}

        <section className="member-layout">
          <header className="member-card-header">
            <div className="member-public-summary">
              <div className="member-avatar">{getInitials(member.completeName)}</div>
              <div>
                <h1>{member.completeName}</h1>
                <p className="member-meta">
                  Numero de socio #{member.memberNumber}
                </p>
                <div className="member-badges">
                  <span className="member-status-chip" data-status={member.status}>
                    {statusText(member.status)}
                  </span>
                  <span className="member-chip">
                    {member.category === "ATLETA_SOCIO" ? "Atleta socio" : "Socio"}
                  </span>
                  <span className="member-chip">{member.city}</span>
                </div>
              </div>
            </div>

            <div className="member-toolbar">
              <p>
                Para utilizadores normais so aparecem os dados revelaveis. Para o
                proprio socio aparece tambem a componente financeira.
              </p>

              <div className="members-actions">
                <Link
                  className="secondary-button"
                  to={`/members/${member.memberId}/edit`}
                >
                  <PencilLine size={18} />
                  Atualizar ficha
                </Link>
                {isAdmin && member.status === "PENDENTE" ? (
                  <>
                    <button className="primary-button" onClick={handleApprove} type="button">
                      <CheckCircle2 size={18} />
                      Aprovar
                    </button>
                    <button className="danger-button" onClick={handleReject} type="button">
                      <XCircle size={18} />
                      Rejeitar
                    </button>
                  </>
                ) : null}
              </div>
            </div>
          </header>

          <section className="page-panel">
            <div className="member-summary-grid">
              <div className="member-summary-item">
                <span>Nome revelavel</span>
                <strong>{member.completeName}</strong>
              </div>
              <div className="member-summary-item">
                <span>Numero de socio</span>
                <strong>#{member.memberNumber}</strong>
              </div>
              <div className="member-summary-item">
                <span>Estado</span>
                <strong>{statusText(member.status)}</strong>
              </div>
            </div>
          </section>

          {isAdmin ? (
            <section className="page-panel">
              <div className="member-finance-head">
                <div>
                  <h2 className="member-section-title">Informacao de administracao</h2>
                  <p>
                    Vista completa com os dados necessarios para avaliacao e
                    acompanhamento do socio.
                  </p>
                </div>
                <Shield size={20} />
              </div>

              <div className="member-detail-grid">
                <div className="member-detail-list">
                  <span>Email</span>
                  <strong>{member.email}</strong>
                </div>
                <div className="member-detail-list">
                  <span>Telemovel</span>
                  <strong>{member.phone}</strong>
                </div>
                <div className="member-detail-list">
                  <span>Telefone de casa</span>
                  <strong>{member.homePhone || "Nao indicado"}</strong>
                </div>
                <div className="member-detail-list">
                  <span>Morada</span>
                  <strong>{member.address}</strong>
                </div>
                <div className="member-detail-list">
                  <span>Codigo postal e cidade</span>
                  <strong>
                    {member.postalCode} - {member.city}
                  </strong>
                </div>
                <div className="member-detail-list">
                  <span>Local de cobranca</span>
                  <strong>{member.billingLocation || "Nao definido"}</strong>
                </div>
                <div className="member-detail-list">
                  <span>Data de registo</span>
                  <strong>{formatDate(member.registrationDate)}</strong>
                </div>
                <div className="member-detail-list">
                  <span>Data de aprovacao</span>
                  <strong>{formatDate(member.approvalDate)}</strong>
                </div>
                <div className="member-detail-list">
                  <span>Consentimentos</span>
                  <strong>
                    Privacidade: {member.privacyAccepted ? "Sim" : "Nao"} -
                    Comunicacoes: {member.comsAccepted ? "Sim" : "Nao"}
                  </strong>
                </div>
              </div>
            </section>
          ) : null}

          {isSelf ? (
            <>
              <section className="member-status-banner">
                <div>
                  <h2 className="member-section-title">Resumo financeiro</h2>
                  <p className="support-note">
                    Valores do backend estao em centimos e aqui sao apresentados
                    em euros. O historico abaixo usa dados de demonstracao ate
                    existirem endpoints de cobrancas e pagamentos.
                  </p>
                </div>
                <Wallet size={22} />
              </section>

              <section className="member-finance-card">
                <div className="member-finance-grid">
                  <div className="member-finance-item">
                    <span>Quota mensal</span>
                    <strong>{eurosFromCents(member.membershipQuota)}</strong>
                  </div>
                  <div className="member-finance-item">
                    <span>Quotas em atraso</span>
                    <strong>{debtSummary.pendingCount}</strong>
                  </div>
                  <div className="member-finance-item">
                    <span>Total em divida</span>
                    <strong>{eurosFromCents(debtSummary.pendingCents)}</strong>
                  </div>
                </div>

                {paymentHistory.length === 0 ? (
                  <div className="empty-card">
                    <User size={18} />
                    <p>
                      Este socio nao tem quotas de socio para apresentar no
                      historico.
                    </p>
                  </div>
                ) : (
                  <div className="member-payment-list">
                    {paymentHistory.map((item) => (
                      <div
                        className={`member-payment-row ${
                          item.status === "PENDING" ? "is-pending" : "is-paid"
                        }`}
                        key={item.id}
                      >
                        <div>
                          <strong>{item.label}</strong>
                          <span>
                            Epoca {item.season} - vencimento {formatDate(item.dueDate)}
                          </span>
                        </div>

                        <div>
                          <strong>{eurosFromCents(item.amountCents)}</strong>
                          <time>
                            {item.status === "PAID"
                              ? `Pago em ${formatDate(item.paidDate)}`
                              : "Em atraso"}
                          </time>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          ) : null}
        </section>
      </div>
    </main>
  );
}
