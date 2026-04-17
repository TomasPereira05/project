import "./Home.css";
import {
  ArrowRight,
  BadgeEuro,
  CalendarDays,
  ShieldCheck,
  Ticket,
  UserRound,
  Users,
  Waves,
} from "lucide-react";

const featureCards = [
  {
    icon: Users,
    title: "Socios e atletas",
    description:
      "Acompanha inscricoes, estados de aprovacao, categorias e o ciclo de vida de cada membro do clube.",
  },
  {
    icon: BadgeEuro,
    title: "Quotas e cobrancas",
    description:
      "Centraliza mensalidades, pagamentos e cobrancas pendentes para manter a operacao organizada.",
  },
  {
    icon: CalendarDays,
    title: "Eventos e bilhetes",
    description:
      "Prepara eventos, gere bilhetes e simplifica a relacao entre comunidade, jogo e presenca.",
  },
  {
    icon: ShieldCheck,
    title: "Aprovacoes com contexto",
    description:
      "Torna claro quem esta pendente, ativo, rejeitado ou reativado sem perder historico.",
  },
];

const quickHighlights = [
  "Gestao de socios",
  "Inscricao de atletas",
  "Sponsors e parcerias",
  "Bilhetes para eventos",
];

const operationalPillars = [
  {
    label: "Comunidade",
    value: "Membros, encarregados e relacoes familiares no clube.",
  },
  {
    label: "Financeiro",
    value: "Quotas, pagamentos, cobrancas e confirmacoes.",
  },
  {
    label: "Atividade",
    value: "Eventos, equipas, epocas e momentos do calendario.",
  },
];

export default function Home() {
  return (
    <main className="home-page">
      <section className="hero-section">
        <div className="hero-overlay" />
        <div className="hero-shell">
          <header className="topbar">
            <div className="brand-lockup">
              <div className="brand-mark">
                <Waves size={22} strokeWidth={2.2} />
              </div>
              <div>
                <p className="eyebrow">Ericeira, identidade e jogo</p>
                <h1>Jagoz</h1>
              </div>
            </div>

            <nav className="topbar-nav" aria-label="Secoes da pagina">
              <a href="#visao">Visao</a>
              <a href="#modulos">Modulos</a>
              <a href="#fluxo">Fluxo</a>
            </nav>
          </header>

          <div className="hero-grid">
            <div className="hero-copy">
              <span className="hero-badge">Plataforma para comunidade desportiva</span>
              <h2>
                Uma home page com alma de clube, ritmo de secretaria e energia
                de mar.
              </h2>
              <p>
                O backend ja mostra a direcao certa: membros, atletas, quotas,
                eventos, bilhetes e patrocinadores. A nova home transforma isso
                numa primeira impressao mais forte, mais clara e mais tua.
              </p>

              <div className="hero-actions">
                <a className="primary-action" href="#modulos">
                  Explorar capacidades
                  <ArrowRight size={18} />
                </a>
                <a className="secondary-action" href="#visao">
                  Ver conceito visual
                </a>
              </div>

              <ul className="highlight-strip" aria-label="Destaques principais">
                {quickHighlights.map((highlight) => (
                  <li key={highlight}>{highlight}</li>
                ))}
              </ul>
            </div>

            <aside className="hero-panel" aria-label="Resumo do produto">
              <div className="panel-glow" />
              <div className="status-card">
                <span>Panorama atual</span>
                <strong>Clube, atletas e operacao num unico sitio</strong>
                <p>
                  A base que ja tens suporta gestao de membros, estados,
                  cobrancas, eventos e sponsors.
                </p>
              </div>

              <div className="mini-dashboard">
                <div>
                  <UserRound size={18} />
                  <span>Membros em fluxo de aprovacao</span>
                </div>
                <div>
                  <BadgeEuro size={18} />
                  <span>Pagamentos e quotas por acompanhar</span>
                </div>
                <div>
                  <Ticket size={18} />
                  <span>Eventos com bilhetica integrada</span>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="vision-section" id="visao">
        <div className="section-heading">
          <span>Visao da experiencia</span>
          <h3>
            Menos aspeto de dashboard generico. Mais presenca, confianca e
            identidade local.
          </h3>
        </div>

        <div className="pillars-grid">
          {operationalPillars.map((pillar) => (
            <article key={pillar.label} className="pillar-card">
              <p>{pillar.label}</p>
              <strong>{pillar.value}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="features-section" id="modulos">
        <div className="section-heading">
          <span>Modulos que ja fazem sentido no produto</span>
          <h3>
            A home comunica o que a app realmente faz em vez de prometer
            funcionalidades vagas.
          </h3>
        </div>

        <div className="feature-grid">
          {featureCards.map(({ icon: Icon, title, description }) => (
            <article key={title} className="feature-card">
              <div className="feature-icon">
                <Icon size={22} strokeWidth={2.1} />
              </div>
              <h4>{title}</h4>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="journey-section" id="fluxo">
        <div className="section-heading">
          <span>Fluxo de utilizacao</span>
          <h3>
            Uma narrativa simples para quem entra pela primeira vez na
            plataforma.
          </h3>
        </div>

        <div className="journey-steps">
          <article>
            <strong>01</strong>
            <h4>Registar</h4>
            <p>Novos membros e atletas entram no sistema com dados validados.</p>
          </article>
          <article>
            <strong>02</strong>
            <h4>Aprovar e organizar</h4>
            <p>
              A secretaria acompanha estados, categorias e reativacoes sem
              perder controlo.
            </p>
          </article>
          <article>
            <strong>03</strong>
            <h4>Ativar a comunidade</h4>
            <p>
              Quotas, eventos, bilhetes e sponsors passam a viver na mesma
              experiencia.
            </p>
          </article>
        </div>
      </section>

      <footer className="page-footer">
        <p>Jagoz</p>
        <span>
          Conceito visual inspirado na Ericeira e nas funcionalidades ja
          presentes no backend Kotlin.
        </span>
      </footer>
    </main>
  );
}
