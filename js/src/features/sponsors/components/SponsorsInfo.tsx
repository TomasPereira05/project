import { ArrowRight, Settings, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../shared/hooks/useAuth";

export default function SponsorsInfo() {
  const { role } = useAuth();
  const canManage = role === "ADMIN" || role === "SECRETARIA";

  return (
    <main className="sponsor-page">
      <div className="sponsor-shell">
        <section className="sponsor-hero">
          <div className="sponsor-hero-copy">
            <p className="sponsor-kicker">Patrocinios</p>
            <h1 className="sponsor-title">Apoie o clube e ganhe visibilidade</h1>
            <p className="sponsor-description">
              Nesta area vais encontrar as modalidades de patrocinio disponiveis, uma pagina dedicada para submeter o
              teu patrocinio e, para administracao, acesso rapido a aprovacoes e configuracao.
            </p>
            <div className="sponsor-hero-actions">
              <Link className="sponsor-button-primary" to="/sponsors/create">
                Criar patrocinio
                <ArrowRight size={16} />
              </Link>
              {canManage ? (
                <>
                  <Link className="sponsor-button-secondary" to="/sponsors/approvals">
                    <ShieldCheck size={16} />
                    Aprovar pedidos
                  </Link>
                  <Link className="sponsor-button-secondary" to="/sponsors/settings">
                    <Settings size={16} />
                    Settings
                  </Link>
                </>
              ) : null}
            </div>
          </div>
          <div className="sponsor-highlight-card">
            <p className="sponsor-highlight-label">Como funciona</p>
            <strong className="sponsor-highlight-value">3 passos</strong>
            <span className="sponsor-highlight-meta">Escolher opcao, preencher dados e aguardar aprovacao.</span>
          </div>
        </section>

        <section className="sponsor-info-grid">
          <article className="sponsor-info-card">
            <h2>Pagina de criacao</h2>
            <p>Formulario simples com nome, NIF, email, telefone e escolha de uma opcao de patrocinio disponivel.</p>
            <Link className="sponsor-link-button" to="/sponsors/create">
              Ir para criacao
            </Link>
          </article>
          <article className="sponsor-info-card">
            <h2>Patrocinios disponiveis</h2>
            <p>
              As opcoes aparecem automaticamente a partir da configuracao ativa que os administradores mantem no painel
              de settings.
            </p>
          </article>
          <article className="sponsor-info-card">
            <h2>Aprovacao interna</h2>
            <p>Os admins e secretaria podem rever os pedidos pendentes e aprovar, marcar como pago ou cancelar.</p>
          </article>
        </section>
      </div>
    </main>
  );
}
