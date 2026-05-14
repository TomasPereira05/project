import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  IdCard,
  LogOut,
  Mail,
  Phone,
  Shield,
  User as UserIcon,
  UserPlus,
  Users,
} from "lucide-react";
import Header from "../../../shared/components/Header";
import Footer from "../../../shared/components/Footer";
import { useAuth } from "../../../shared/hooks/useAuth";
import { fetchMember, type Member } from "../../Members";
import { getInitials } from "../../../shared/utils";
import { getMyAthlete, type AthleteAdmin } from "../../Athletes";
import { claimSponsorAccount } from "../../sponsors";
import { roleLabel, roleBadgeColor } from "../utils";

export default function UserPage() {
  const navigate = useNavigate();
  const { username, email, role, activeMemberId, clearAuth } = useAuth();

  const [member, setMember] = useState<Member | null>(null);
  const [athlete, setAthlete] = useState<AthleteAdmin | null>(null);
  const [claimForm, setClaimForm] = useState({ nif: "", email: "", phone: "" });
  const [claimMessage, setClaimMessage] = useState("");
  const [claimError, setClaimError] = useState("");

  useEffect(() => {
    let ignore = false;

    if (!activeMemberId) {
      setMember(null);
      setAthlete(null);
      return;
    }

    fetchMember(activeMemberId)
      .then((res) => {
        if (!ignore) setMember(res);
      })
      .catch(() => {
        if (!ignore) setMember(null);
      });

    getMyAthlete()
      .then((res) => {
        if (!ignore) setAthlete(res);
      })
      .catch(() => {
        if (!ignore) setAthlete(null);
      });

    return () => {
      ignore = true;
    };
  }, [activeMemberId]);

  const handleLogout = () => {
    if (clearAuth) clearAuth();
    navigate("/");
  };

  async function handleSponsorClaim(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setClaimMessage("");
    setClaimError("");

    try {
      const sponsor = await claimSponsorAccount(claimForm);
      setClaimMessage(`Conta associada ao patrocinador ${sponsor.name}.`);
      setClaimForm({ nif: "", email: "", phone: "" });
    } catch (error) {
      setClaimError(error instanceof Error ? error.message : "Nao foi possivel associar a conta ao patrocinador.");
    }
  }

  const displayName = username ?? "Utilizador";
  const hasSpecialRole = role === "ADMIN" || role === "SECRETARIA";

  return (
    <div>
      <Header />
      <main className="member-page">
        <div className="member-detail-container">

          <div className="flex justify-between items-center mb-6">
            <button
              onClick={() => window.history.back()}
              className="text-text-secondary hover:text-primary transition-colors flex items-center gap-2 text-sm font-semibold uppercase tracking-wide"
            >
              <ArrowLeft size={18} />
              Voltar
            </button>
          </div>

          {/* PROFILE HEADER */}
          <section className="member-card mb-8">
            <div className="bg-gradient-to-r from-[#001D4A] to-primary h-32"></div>
            <div className="px-6 sm:px-10 pb-8 relative">
              <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-6 -mt-12 sm:-mt-16 mb-6">
                <div className="flex items-end gap-5">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 bg-white rounded-full flex items-center justify-center text-3xl sm:text-4xl font-heading text-primary border-4 border-white shadow-md">
                    {getInitials(displayName)}
                  </div>
                  <div className="pb-2 mt-16 sm:mt-20">
                    <h1 className="font-heading text-2xl sm:text-3xl text-text-primary uppercase tracking-tight">
                      {displayName}
                    </h1>
                    <p className="text-text-secondary font-medium mt-1">Conta de utilizador</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pb-2">
                  {hasSpecialRole && (
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${roleBadgeColor(role)}`}>
                      {roleLabel(role)}
                    </span>
                  )}
                  {member && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                      Sócio #{member.memberNumber}
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center justify-center gap-2 text-sm font-semibold uppercase tracking-wide h-10 px-6 border-2 border-primary text-primary bg-transparent hover:bg-primary hover:text-white transition-colors rounded-md"
                >
                  <LogOut size={18} />
                  Sair
                </button>
              </div>
            </div>
          </section>

          {/* ACCOUNT INFO */}
          <section className="member-card mb-8">
            <div className="px-6 py-5 border-b border-border bg-gray-50/50 flex items-center gap-3">
              <div className="p-2 bg-primary/10 text-primary rounded-lg">
                <UserIcon size={20} />
              </div>
              <div>
                <h2 className="font-heading text-xl text-text-primary uppercase tracking-tight">Dados da Conta</h2>
                <p className="text-xs text-text-secondary mt-1">Informação associada ao seu utilizador.</p>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-10">
                <div className="flex items-start gap-3">
                  <UserIcon size={18} className="text-text-secondary mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Nome de Utilizador</p>
                    <p className="font-medium text-text-primary mt-1">{displayName}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail size={18} className="text-text-secondary mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Email</p>
                    <p className="font-medium text-text-primary mt-1 break-all">{email ?? "—"}</p>
                  </div>
                </div>
                {hasSpecialRole && (
                  <div className="flex items-start gap-3">
                    <Shield size={18} className="text-text-secondary mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Tipo de Conta</p>
                      <p className="font-medium text-text-primary mt-1">{roleLabel(role)}</p>
                    </div>
                  </div>
                )}
                {member && (
                  <div className="flex items-start gap-3">
                    <IdCard size={18} className="text-text-secondary mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Número de Sócio</p>
                      <p className="font-medium text-text-primary mt-1">#{member.memberNumber}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* MEMBER LINK */}
          <section className="member-card mb-8">
            <div className="px-6 py-5 border-b border-border bg-gray-50/50 flex items-center gap-3">
              <div className="p-2 bg-primary/10 text-primary rounded-lg">
                <Users size={20} />
              </div>
              <div>
                <h2 className="font-heading text-xl text-text-primary uppercase tracking-tight">Sócio</h2>
                <p className="text-xs text-text-secondary mt-1">
                  {member ? "Acesso à sua ficha de sócio." : "Ainda não tem ficha de sócio associada."}
                </p>
              </div>
            </div>

            <div className="p-6 flex flex-wrap gap-3">
              {member ? (
                <Link
                  to={`/members/${member.memberId}`}
                  className="inline-flex items-center justify-center gap-2 text-sm font-semibold uppercase tracking-wide h-10 px-6 border-2 border-primary bg-primary text-white hover:bg-primary-hover transition-colors rounded-md"
                >
                  <Users size={18} />
                  Ver Ficha de Sócio
                </Link>
              ) : (
                <Link
                  to="/members/create"
                  className="inline-flex items-center justify-center gap-2 text-sm font-semibold uppercase tracking-wide h-10 px-6 border-2 border-primary bg-primary text-white hover:bg-primary-hover transition-colors rounded-md"
                >
                  <UserPlus size={18} />
                  Tornar-se Sócio
                </Link>
              )}
            </div>
          </section>

          {/* ATHLETE LINK (only when applicable) */}
          {athlete && (
            <section className="member-card mb-8">
              <div className="px-6 py-5 border-b border-border bg-gray-50/50 flex items-center gap-3">
                <div className="p-2 bg-primary/10 text-primary rounded-lg">
                  <UserPlus size={20} />
                </div>
                <div>
                  <h2 className="font-heading text-xl text-text-primary uppercase tracking-tight">Atleta</h2>
                  <p className="text-xs text-text-secondary mt-1">
                    Escalão atual: {athlete.teamCategoryLabel}.
                  </p>
                </div>
              </div>

              <div className="p-6 flex flex-wrap gap-3">
                <Link
                  to={`/athletes/${athlete.athleteId}`}
                  className="inline-flex items-center justify-center gap-2 text-sm font-semibold uppercase tracking-wide h-10 px-6 border-2 border-primary bg-primary text-white hover:bg-primary-hover transition-colors rounded-md"
                >
                  <UserPlus size={18} />
                  Ver Ficha de Atleta
                </Link>
              </div>
            </section>
          )}

          <section className="member-card mb-8">
            <div className="px-6 py-5 border-b border-border bg-gray-50/50 flex items-center gap-3">
              <div className="p-2 bg-primary/10 text-primary rounded-lg">
                <IdCard size={20} />
              </div>
              <div>
                <h2 className="font-heading text-xl text-text-primary uppercase tracking-tight">Patrocinador</h2>
                <p className="text-xs text-text-secondary mt-1">Associe esta conta a um patrocinador ja registado.</p>
              </div>
            </div>

            <form className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4" onSubmit={handleSponsorClaim}>
              <label className="flex flex-col gap-2 text-sm font-semibold text-text-primary">
                NIF
                <input
                  className="member-input"
                  required
                  value={claimForm.nif}
                  onChange={(event) => setClaimForm((current) => ({ ...current, nif: event.target.value }))}
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold text-text-primary">
                Email
                <input
                  className="member-input"
                  required
                  type="email"
                  value={claimForm.email}
                  onChange={(event) => setClaimForm((current) => ({ ...current, email: event.target.value }))}
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold text-text-primary">
                Telemovel
                <input
                  className="member-input"
                  required
                  value={claimForm.phone}
                  onChange={(event) => setClaimForm((current) => ({ ...current, phone: event.target.value }))}
                />
              </label>
              <div className="md:col-span-3 flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 text-sm font-semibold uppercase tracking-wide h-10 px-6 border-2 border-primary bg-primary text-white hover:bg-primary-hover transition-colors rounded-md"
                >
                  <Phone size={18} />
                  Associar Patrocinador
                </button>
                {claimMessage ? <p className="text-sm font-medium text-green-700">{claimMessage}</p> : null}
                {claimError ? <p className="text-sm font-medium text-red-700">{claimError}</p> : null}
              </div>
            </form>
          </section>

        </div>
      </main>
      <Footer />
    </div>
  );
}
