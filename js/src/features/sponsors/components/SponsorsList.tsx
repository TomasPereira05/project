import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Building2, ChevronLeft, ChevronRight, Search, UserRound } from "lucide-react";
import { fetchSponsors } from "../api";
import type { Sponsor } from "../types";

const PAGE_SIZE = 12;
const SEARCH_DEBOUNCE_MS = 500;

export default function SponsorsList() {
  const { t } = useTranslation();
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeout);
  }, [searchTerm]);

  useEffect(() => {
    let ignore = false;

    async function loadSponsors() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const response = await fetchSponsors(page, PAGE_SIZE, { search: debouncedSearchTerm });
        if (!ignore) {
          setSponsors(response.items);
          setTotalItems(response.total);
          setTotalPages(response.totalPages);
        }
      } catch {
        if (!ignore) setErrorMessage(t("sponsors.companies.errors.load"));
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    void loadSponsors();

    return () => {
      ignore = true;
    };
  }, [debouncedSearchTerm, page, t]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  return (
    <main className="sponsor-page">
      <div className="sponsor-shell">
        <section className="sponsor-page-header">
          <div>
            <p className="sponsor-section-eyebrow">{t("sponsors.companies.eyebrow")}</p>
            <h1 className="sponsor-panel-title">{t("sponsors.companies.title")}</h1>
            <p className="sponsor-muted-text">{t("sponsors.companies.description")}</p>
          </div>
        </section>

        {errorMessage ? <div className="sponsor-feedback sponsor-feedback-error">{errorMessage}</div> : null}

        <section className="sponsor-panel">
          <div className="sponsor-admin-filters sponsor-admin-filters-wide">
            <label className="sponsor-admin-filter">
              <span>{t("sponsors.companies.filters.search")}</span>
              <div className="sponsor-admin-search">
                <Search size={18} />
                <input
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder={t("sponsors.companies.filters.searchPlaceholder")}
                  type="search"
                  value={searchTerm}
                />
              </div>
            </label>
          </div>

          {isLoading ? (
            <div className="sponsor-empty-card">{t("sponsors.companies.loading")}</div>
          ) : sponsors.length === 0 ? (
            <div className="sponsor-empty-card">{t("sponsors.companies.empty")}</div>
          ) : (
            <div className="sponsor-table-wrap">
              <table className="sponsor-admin-table">
                <thead>
                  <tr>
                    <th>{t("sponsors.fields.name")}</th>
                    <th>{t("sponsors.fields.nif")}</th>
                    <th>{t("sponsors.fields.email")}</th>
                    <th>{t("sponsors.fields.phone")}</th>
                    <th>{t("sponsors.companies.columns.account")}</th>
                  </tr>
                </thead>
                <tbody>
                  {sponsors.map((sponsor) => (
                    <tr key={sponsor.sponsorId}>
                      <td>
                        <div className="sponsor-company-name">
                          <Building2 size={18} />
                          <strong>{sponsor.name}</strong>
                        </div>
                      </td>
                      <td>{sponsor.nif}</td>
                      <td>{sponsor.email}</td>
                      <td>{sponsor.phone}</td>
                      <td>
                        {sponsor.userId ? (
                          <Link className="sponsor-user-link" to={`/admin/users/${sponsor.userId}`}>
                            <UserRound size={16} />
                            {sponsor.accountUsername}
                          </Link>
                        ) : (
                          <span className="sponsor-muted-text">{t("sponsors.companies.noAccount")}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="member-pagination">
          <p className="member-pagination-text">
            {t("sponsors.pagination.showing")}{" "}
            <span className="member-pagination-strong">{totalItems === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}</span>{" "}
            {t("sponsors.pagination.to")}{" "}
            <span className="member-pagination-strong">{Math.min(page * PAGE_SIZE, totalItems)}</span>{" "}
            {t("sponsors.pagination.of")} <span className="member-pagination-strong">{totalItems}</span>{" "}
            {t("sponsors.companies.pagination.items")}
          </p>
          <div className="member-pagination-controls">
            <button className="member-icon-btn" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))} type="button">
              <ChevronLeft size={16} />
            </button>
            <span className="member-pagination-current">
              {page} / {totalPages}
            </span>
            <button className="member-icon-btn" disabled={page === totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))} type="button">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
