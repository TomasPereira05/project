import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { approveSponsorship, cancelSponsorship, fetchAllSponsorships, markSponsorshipPaid } from "..";
import type { Sponsor, Sponsorship } from "..";
import { formatCurrency, sponsorshipStatusClass, sponsorshipStatusLabel, sponsorTypeLabel } from "..";
import { useAuth } from "../../../shared/hooks/useAuth";

type SponsorApprovalItem = {
  sponsor: Sponsor;
  sponsorship: Sponsorship;
};

export default function SponsorApprovals() {
  const { role } = useAuth();
  const canManage = role === "ADMIN" || role === "SECRETARIA";
  const [items, setItems] = useState<SponsorApprovalItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!canManage) {
      return;
    }

    let ignore = false;

    async function loadItems() {
      setIsLoading(true);
      setErrorMessage("");
      try {
        const response = await fetchAllSponsorships();
        if (!ignore) {
          setItems(response);
        }
      } catch (error) {
        if (!ignore) {
          setErrorMessage(error instanceof Error ? error.message : "Nao foi possivel carregar os patrocinios.");
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    void loadItems();
    return () => {
      ignore = true;
    };
  }, [canManage]);

  const orderedItems = useMemo(
    () =>
      [...items].sort((first, second) => {
        if (first.sponsorship.status === "SUBMETIDO" && second.sponsorship.status !== "SUBMETIDO") return -1;
        if (first.sponsorship.status !== "SUBMETIDO" && second.sponsorship.status === "SUBMETIDO") return 1;
        return second.sponsorship.sponsorshipId - first.sponsorship.sponsorshipId;
      }),
    [items],
  );

  if (!role) {
    return <Navigate to="/auth/login" replace />;
  }

  if (!canManage) {
    return <Navigate to="/sponsors" replace />;
  }

  async function runAction(sponsorshipId: number, action: "approve" | "paid" | "cancel") {
    try {
      if (action === "approve") {
        await approveSponsorship(sponsorshipId);
      } else if (action === "paid") {
        await markSponsorshipPaid(sponsorshipId);
      } else {
        await cancelSponsorship(sponsorshipId);
      }
      const response = await fetchAllSponsorships();
      setItems(response);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Nao foi possivel atualizar o patrocinio.");
    }
  }

  return (
    <main className="sponsor-page">
      <div className="sponsor-shell">
        <section className="sponsor-page-header">
          <div>
            <p className="sponsor-section-eyebrow">Aprovacoes</p>
            <h1 className="sponsor-panel-title">Lista de patrocinios</h1>
            <p className="sponsor-muted-text">Reve pedidos pendentes e gere o fluxo de aprovacao e pagamento.</p>
          </div>
          <Link className="sponsor-button-secondary" to="/sponsors/settings">
            Ir para settings
          </Link>
        </section>

        {errorMessage ? (
          <div className="sponsor-feedback sponsor-feedback-error">
            <ShieldAlert size={18} />
            <span>{errorMessage}</span>
          </div>
        ) : null}

        <section className="sponsor-panel">
          {isLoading ? (
            <div className="sponsor-empty-card">A carregar patrocinios...</div>
          ) : orderedItems.length === 0 ? (
            <div className="sponsor-empty-card">Nao existem patrocinios registados.</div>
          ) : (
            <div className="sponsor-contract-list">
              {orderedItems.map(({ sponsor, sponsorship }) => (
                <article className="sponsor-contract-card" key={sponsorship.sponsorshipId}>
                  <div className="sponsor-contract-main">
                    <div>
                      <div className="sponsor-contract-topline">
                        <strong>{sponsor.name}</strong>
                        <span className={sponsorshipStatusClass(sponsorship.status)}>
                          {sponsorshipStatusLabel(sponsorship.status)}
                        </span>
                      </div>
                      <p className="sponsor-contract-target">
                        {sponsorTypeLabel(sponsorship.type)} · {formatCurrency(sponsorship.price)}
                      </p>
                      <p className="sponsor-contract-meta">
                        NIF {sponsor.nif} · {sponsor.email} · {sponsor.phone} · Epoca {sponsorship.season}
                      </p>
                    </div>
                    <div className="sponsor-contract-actions">
                      {sponsorship.status === "SUBMETIDO" ? (
                        <button className="sponsor-button-primary" onClick={() => void runAction(sponsorship.sponsorshipId, "approve")} type="button">
                          Aprovar
                        </button>
                      ) : null}
                      {sponsorship.status === "APROVADO" ? (
                        <button className="sponsor-button-secondary" onClick={() => void runAction(sponsorship.sponsorshipId, "paid")} type="button">
                          Marcar pago
                        </button>
                      ) : null}
                      {sponsorship.status !== "CANCELADO" && sponsorship.status !== "PAGO" ? (
                        <button className="sponsor-button-ghost" onClick={() => void runAction(sponsorship.sponsorshipId, "cancel")} type="button">
                          Cancelar
                        </button>
                      ) : null}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
