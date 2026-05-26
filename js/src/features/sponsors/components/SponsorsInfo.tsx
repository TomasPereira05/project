import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ArrowRight, Settings, ShieldAlert, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../shared/hooks/useAuth";
import { formatCurrency } from "../../../shared/utils";
import { useSponsorCatalogs } from "../hooks";
import {
  buildSponsorOtherRows,
  buildSponsorPubRows,
  buildSponsorTeamColumns,
  buildSponsorTeamMatrix,
} from "../utils";

export default function SponsorsInfo() {
  const { t } = useTranslation();
  const { role } = useAuth();
  const canManage = role === "ADMIN" || role === "SECRETARIA";
  const { catalogs, errorMessage, isLoading } = useSponsorCatalogs();

  const pubRows = useMemo(() => buildSponsorPubRows(catalogs), [catalogs]);
  const otherRows = useMemo(() => buildSponsorOtherRows(catalogs), [catalogs]);
  const teamColumns = useMemo(() => buildSponsorTeamColumns(catalogs), [catalogs]);
  const teamMatrix = useMemo(() => buildSponsorTeamMatrix(catalogs, teamColumns), [catalogs, teamColumns]);

  return (
    <main className="sponsor-page">
      <div className="sponsor-shell">
        <section className="sponsor-hero">
          <div className="sponsor-hero-copy">
            <p className="sponsor-kicker">{t("sponsors.info.kicker")}</p>
            <h1 className="sponsor-title">{t("sponsors.info.title")}</h1>
            <p className="sponsor-description">{t("sponsors.info.description1")}</p>
            <p className="sponsor-description">{t("sponsors.info.description2")}</p>
            <p className="sponsor-description">{t("sponsors.info.description3")}</p>
            <div className="sponsor-hero-actions">
              <Link className="sponsor-button-primary" to="/sponsors/create">
                {t("sponsors.info.create")}
                <ArrowRight size={16} />
              </Link>
              {canManage ? (
                <>
                  <Link className="sponsor-button-secondary" to="/admin/sponsors/approvals">
                    <ShieldCheck size={16} />
                    {t("sponsors.info.approve")}
                  </Link>
                  <Link className="sponsor-button-secondary" to="/admin/sponsors/settings">
                    <Settings size={16} />
                    {t("sponsors.info.settings")}
                  </Link>
                </>
              ) : null}
            </div>
          </div>
          <div className="sponsor-highlight-card">
            <p className="sponsor-highlight-label">{t("sponsors.info.highlightLabel")}</p>
            <strong className="sponsor-highlight-value">{t("sponsors.info.highlightValue")}</strong>
            <span className="sponsor-highlight-meta">{t("sponsors.info.highlightMeta")}</span>
          </div>
        </section>

        {errorMessage ? (
          <div className="sponsor-feedback sponsor-feedback-error">
            <ShieldAlert size={18} />
            <span>{errorMessage}</span>
          </div>
        ) : null}

        <section className="sponsor-brochure-grid">
          <article className="sponsor-brochure-card sponsor-brochure-copy">
            <h2>{t("sponsors.info.pubPackage.title")}</h2>
            <ul className="sponsor-brochure-list">
              <li>{t("sponsors.info.pubPackage.items.0")}</li>
              <li>{t("sponsors.info.pubPackage.items.1")}</li>
            </ul>
          </article>

          <article className="sponsor-brochure-card sponsor-brochure-table-card">
            <div className="sponsor-table-headline">
              <h3>{t("sponsors.info.pubTable")}</h3>
              <span>{isLoading ? t("sponsors.common.loading") : t("sponsors.info.optionCount", { count: pubRows.length })}</span>
            </div>
            {pubRows.length === 0 ? (
              <div className="sponsor-empty-card">{t("sponsors.info.empty.pub")}</div>
            ) : (
              <div className="sponsor-table-wrapper">
                <table className="sponsor-table">
                  <thead>
                    <tr>
                      <th>{t("sponsors.fields.description")}</th>
                      <th>{t("sponsors.fields.free")}</th>
                      <th>{t("sponsors.fields.value")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pubRows.map((row) => (
                      <tr key={row.id}>
                        <td>{row.label}</td>
                        <td>{row.free}</td>
                        <td>{row.price == null ? "-" : formatCurrency(row.price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </article>
        </section>

        <section className="sponsor-brochure-grid sponsor-brochure-grid-wide">
          <article className="sponsor-brochure-card sponsor-brochure-copy">
            <h2>{t("sponsors.info.teamPackage.title")}</h2>
            <ul className="sponsor-brochure-list">
              <li>{t("sponsors.info.teamPackage.items.0")}</li>
              <li>{t("sponsors.info.teamPackage.items.1")}</li>
              <li>{t("sponsors.info.teamPackage.items.2")}</li>
              <li>{t("sponsors.info.teamPackage.items.3")}</li>
            </ul>
          </article>

          <article className="sponsor-brochure-card sponsor-brochure-table-card">
            <div className="sponsor-table-headline">
              <h3>{t("sponsors.info.teamTable")}</h3>
              <span>{isLoading ? t("sponsors.common.loading") : t("sponsors.info.optionCount", { count: teamColumns.length })}</span>
            </div>
            {teamColumns.length === 0 || catalogs.equipmentPlacements.length === 0 ? (
              <div className="sponsor-empty-card">{t("sponsors.info.empty.team")}</div>
            ) : (
              <div className="sponsor-table-wrapper">
                <table className="sponsor-table">
                  <thead>
                    <tr>
                      <th>{t("sponsors.fields.equipment")}</th>
                      {teamColumns.map((column) => (
                        <th key={column.id}>{column.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {teamMatrix.map((row) => (
                      <tr key={row.placement.equipmentId}>
                        <td>{row.placement.label}</td>
                        {row.values.map((value) => (
                          <td key={`${row.placement.equipmentId}-${value.id}`}>
                            {value.price == null ? "-" : formatCurrency(value.price)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </article>
        </section>

        <section className="sponsor-brochure-grid">
          <article className="sponsor-brochure-card sponsor-brochure-copy">
            <h2>{t("sponsors.info.otherPackage.title")}</h2>
            <ul className="sponsor-brochure-list">
              <li>{t("sponsors.info.otherPackage.items.0")}</li>
            </ul>
          </article>

          <article className="sponsor-brochure-card sponsor-brochure-table-card">
            <div className="sponsor-table-headline">
              <h3>{t("sponsors.info.otherTable")}</h3>
              <span>{isLoading ? t("sponsors.common.loading") : t("sponsors.info.sportCount", { count: otherRows.length })}</span>
            </div>
            {otherRows.length === 0 ? (
              <div className="sponsor-empty-card">{t("sponsors.info.empty.other")}</div>
            ) : (
              <div className="sponsor-table-wrapper">
                <table className="sponsor-table">
                  <thead>
                    <tr>
                      <th>{t("sponsors.fields.sport")}</th>
                      <th>{t("sponsors.fields.value")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {otherRows.map((row) => (
                      <tr key={row.id}>
                        <td>{row.label}</td>
                        <td>{row.price == null ? "-" : formatCurrency(row.price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </article>
        </section>
      </div>
    </main>
  );
}
