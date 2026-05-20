import { CheckCircle2, ExternalLink } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router-dom";

export default function PaymentSuccess() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");

  return (
    <main className="min-h-[70vh] bg-slate-50 px-4 py-16">
      <section className="mx-auto flex max-w-2xl flex-col items-center gap-6 rounded-lg border border-emerald-100 bg-white px-6 py-10 text-center shadow-sm">
        <CheckCircle2 className="h-14 w-14 text-emerald-600" aria-hidden="true" />
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">{t("payments.success.eyebrow")}</p>
          <h1 className="text-3xl font-bold text-slate-950">{t("payments.success.title")}</h1>
          <p className="text-base leading-7 text-slate-600">{t("payments.success.description")}</p>
        </div>
        {sessionId ? (
          <p className="w-full rounded-md bg-slate-100 px-4 py-3 text-sm text-slate-600">
            {t("payments.success.session")} <span className="font-mono text-slate-800">{sessionId}</span>
          </p>
        ) : null}
        <div className="flex flex-wrap justify-center gap-3">
          <Link className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800" to="/sponsors/my">
            {t("payments.success.backToSponsorships")}
          </Link>
          <Link className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100" to="/">
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
            {t("payments.success.home")}
          </Link>
        </div>
      </section>
    </main>
  );
}
