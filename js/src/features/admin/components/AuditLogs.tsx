import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { fetchAuditLogs, type AuditLog, type PaginatedResponse } from "../api";

const emptyPage: PaginatedResponse<AuditLog> = {
  items: [],
  page: 1,
  size: 20,
  total: 0,
  totalPages: 1,
};

export default function AuditLogs() {
  const { t } = useTranslation();
  const [auditPage, setAuditPage] = useState(emptyPage);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadAuditLogs() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const response = await fetchAuditLogs(page, 20);
        if (!ignore) setAuditPage(response);
      } catch {
        if (!ignore) setErrorMessage(t("admin.audit.errors.load"));
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    void loadAuditLogs();

    return () => {
      ignore = true;
    };
  }, [page, t]);

  return (
    <main className="admin-users-page">
      <section className="admin-home-header">
        <p className="admin-eyebrow">{t("admin.audit.eyebrow")}</p>
        <h1>{t("admin.audit.title")}</h1>
        <p>{t("admin.audit.description")}</p>
      </section>

      {errorMessage ? <div className="sponsor-feedback sponsor-feedback-error">{errorMessage}</div> : null}

      <section className="admin-users-panel">
        <div className="admin-section-header">
          <div>
            <p className="admin-eyebrow">{t("admin.audit.listEyebrow")}</p>
            <h2>{t("admin.audit.listTitle")}</h2>
          </div>
          <span className="admin-training-count">
            <ShieldCheck size={16} />
            {isLoading ? "-" : auditPage.total.toLocaleString()}
          </span>
        </div>

        {isLoading ? (
          <div className="sponsor-empty-card">{t("admin.audit.loading")}</div>
        ) : auditPage.items.length === 0 ? (
          <div className="sponsor-empty-card">{t("admin.audit.empty")}</div>
        ) : (
          <div className="admin-users-table-wrap">
            <table className="admin-users-table admin-audit-table">
              <thead>
                <tr>
                  <th>{t("admin.audit.columns.when")}</th>
                  <th>{t("admin.audit.columns.user")}</th>
                  <th>{t("admin.audit.columns.action")}</th>
                  <th>{t("admin.audit.columns.path")}</th>
                  <th>{t("admin.audit.columns.status")}</th>
                  <th>{t("admin.audit.columns.request")}</th>
                </tr>
              </thead>
              <tbody>
                {auditPage.items.map((item) => (
                  <tr key={item.auditLogId}>
                    <td>{new Date(item.occurredAt).toLocaleString()}</td>
                    <td>
                      <strong>{item.username ?? t("admin.audit.anonymous")}</strong>
                      {item.role ? <small>{item.role}</small> : null}
                    </td>
                    <td>
                      <span className={item.outcome === "SUCCESS" ? "admin-audit-success" : "admin-audit-failure"}>
                        {item.action}
                      </span>
                    </td>
                    <td>
                      <strong>{item.method}</strong> {item.path}
                      {item.targetId ? <small>{item.targetType}: {item.targetId}</small> : null}
                    </td>
                    <td>{item.statusCode} · {item.durationMs}ms</td>
                    <td><code>{item.requestId}</code></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="member-pagination">
          <button disabled={page <= 1 || isLoading} onClick={() => setPage((current) => Math.max(1, current - 1))} type="button">
            {t("common.previous", { defaultValue: "Anterior" })}
          </button>
          <span>{auditPage.page} / {auditPage.totalPages}</span>
          <button disabled={page >= auditPage.totalPages || isLoading} onClick={() => setPage((current) => current + 1)} type="button">
            {t("common.next", { defaultValue: "Seguinte" })}
          </button>
        </div>
      </section>
    </main>
  );
}
