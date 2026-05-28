import { useEffect, useMemo, useState } from "react";
import type { TFunction } from "i18next";
import { deactivateMember, fetchMembers } from "../api";
import type { Member, MemberCategory, MemberStatus } from "../types";

export const MEMBERS_PAGE_SIZE = 8;
const SEARCH_DEBOUNCE_MS = 500;

export function useMembersList(role?: string, t?: TFunction<"translation", undefined>) {
  const [members, setMembers] = useState<Member[]>([]);
  const [page, setPage] = useState(1);
  const [totalMembers, setTotalMembers] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<MemberCategory | "">("");
  const [statusFilter, setStatusFilter] = useState<MemberStatus | "">("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeout);
  }, [searchTerm]);

  useEffect(() => {
    let ignore = false;

    async function loadMembers() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const response = await fetchMembers(page, MEMBERS_PAGE_SIZE, {
          search: debouncedSearchTerm,
          category: categoryFilter,
          status: statusFilter,
        });

        if (!ignore) {
          setMembers(response.items);
          setTotalMembers(response.total);
          setTotalPages(response.totalPages);
        }
      } catch {
        if (!ignore) {
          setErrorMessage(t ? t("members.list.errors.load") : "Não foi possível carregar a lista de sócios.");
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    if (role === "ADMIN" || role === "SECRETARIA") {
      loadMembers();
    }

    return () => {
      ignore = true;
    };
  }, [categoryFilter, debouncedSearchTerm, page, refreshKey, role, statusFilter, t]);

  async function deactivate(memberId: number) {
    try {
      await deactivateMember(memberId);
      setRefreshKey((current) => current + 1);
    } catch {
      setErrorMessage(t ? t("members.list.errors.deactivate") : "NÃ£o foi possÃ­vel desativar este sÃ³cio.");
    }
  }

  const pendingMembers = useMemo(
    () => members.filter((member) => member.status === "PENDENTE"),
    [members],
  );

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  return {
    categoryFilter,
    errorMessage,
    isLoading,
    members,
    page,
    pendingMembers,
    searchTerm,
    setCategoryFilter: (category: MemberCategory | "") => {
      setCategoryFilter(category);
      setPage(1);
    },
    setStatusFilter: (status: MemberStatus | "") => {
      setStatusFilter(status);
      setPage(1);
    },
    setPage,
    setSearchTerm: (search: string) => {
      setSearchTerm(search);
    },
    deactivate,
    statusFilter,
    totalMembers,
    totalPages,
  };
}
