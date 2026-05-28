import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Eye, Search } from "lucide-react";
import { api, type UserRole, type UserSummary } from "../../auth/api";
import { roleBadgeColor, roleLabel } from "../utils";

const USERS_PAGE_SIZE = 10;
const USER_ROLES: UserRole[] = ["ADMIN", "SECRETARIA", "NORMAL"];

export default function UsersList() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [page, setPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [role, setRole] = useState<UserRole | "">("");

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);

    return () => window.clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    let ignore = false;

    async function loadUsers() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const response = await api.users.list(page, USERS_PAGE_SIZE, { search: debouncedSearch, role });
        if (!ignore) {
          setUsers(response.items);
          setTotalUsers(response.total);
          setTotalPages(response.totalPages);
        }
      } catch {
        if (!ignore) {
          setErrorMessage(t("users.list.errors.load"));
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    void loadUsers();

    return () => {
      ignore = true;
    };
  }, [debouncedSearch, page, role, t]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  return (
    <main className="admin-users-page">
      <section className="admin-home-header">
        <p className="admin-eyebrow">{t("users.list.eyebrow")}</p>
        <h1>{t("users.list.title")}</h1>
        <p>{t("users.list.description")}</p>
      </section>

      {errorMessage ? <div className="sponsor-feedback sponsor-feedback-error">{errorMessage}</div> : null}

      <section className="admin-users-filters">
        <label className="admin-users-search">
          <Search size={17} />
          <input
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("users.list.filters.search")}
            value={search}
          />
        </label>
        <label className="admin-users-role-filter">
          <span>{t("users.list.filters.role")}</span>
          <select
            onChange={(event) => {
              setRole(event.target.value as UserRole | "");
              setPage(1);
            }}
            value={role}
          >
            <option value="">{t("users.list.filters.allRoles")}</option>
            {USER_ROLES.map((roleOption) => (
              <option key={roleOption} value={roleOption}>
                {roleLabel(roleOption)}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="admin-users-panel">
        {isLoading ? (
          <div className="sponsor-empty-card">{t("users.list.loading")}</div>
        ) : users.length === 0 ? (
          <div className="sponsor-empty-card">{t("users.list.empty")}</div>
        ) : (
          <div className="admin-users-table-wrap">
            <table className="admin-users-table">
              <thead>
                <tr>
                  <th>{t("users.list.columns.username")}</th>
                  <th>{t("users.list.columns.email")}</th>
                  <th>{t("users.list.columns.role")}</th>
                  <th>{t("users.list.columns.activeMember")}</th>
                  <th>{t("users.list.columns.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.userId}>
                    <td>
                      <strong>{user.username}</strong>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`admin-user-role-badge ${roleBadgeColor(user.role)}`}>{roleLabel(user.role)}</span>
                    </td>
                    <td>{user.activeMemberId ? `#${user.activeMemberId}` : "-"}</td>
                    <td>
                      <Link className="member-icon-btn" to={`/admin/users/${user.userId}`} aria-label={t("users.list.actions.viewProfile")}>
                        <Eye size={16} />
                      </Link>
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
          {t("users.list.pagination.showing")}{" "}
          <span className="member-pagination-strong">{totalUsers === 0 ? 0 : (page - 1) * USERS_PAGE_SIZE + 1}</span>{" "}
          {t("users.list.pagination.to")}{" "}
          <span className="member-pagination-strong">{Math.min(page * USERS_PAGE_SIZE, totalUsers)}</span>{" "}
          {t("users.list.pagination.of")} <span className="member-pagination-strong">{totalUsers}</span>{" "}
          {t("users.list.pagination.items")}
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
    </main>
  );
}
