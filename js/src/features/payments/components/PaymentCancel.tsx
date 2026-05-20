import { XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

export default function PaymentCancel() {
  const { t } = useTranslation();

  return (
    <main className="min-h-[70vh] bg-slate-50 px-4 py-16">
      <section className="mx-auto flex max-w-2xl flex-col items-center gap-6 rounded-lg border border-amber-100 bg-white px-6 py-10 text-center shadow-sm">
        <XCircle className="h-14 w-14 text-amber-600" aria-hidden="true" />
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-wide text-amber-700">{t("payments.cancel.eyebrow")}</p>
          <h1 className="text-3xl font-bold text-slate-950">{t("payments.cancel.title")}</h1>
          <p className="text-base leading-7 text-slate-600">{t("payments.cancel.description")}</p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <Link className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800" to="/sponsors/my">
            {t("payments.cancel.backToSponsorships")}
          </Link>
          <Link className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100" to="/">
            {t("payments.cancel.home")}
          </Link>
        </div>
      </section>
    </main>
  );
}
