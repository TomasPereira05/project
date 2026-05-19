import { useEffect, useMemo, useState } from "react";
import type { TFunction } from "i18next";
import { fetchMembers } from "../api";
import type { Member } from "../types";

export const MEMBERS_PAGE_SIZE = 8;

export function useMembersList(role?: string, t?: TFunction<"translation", undefined>) {
  const [members, setMembers] = useState<Member[]>([]);
  const [page, setPage] = useState(1);
  const [totalMembers, setTotalMembers] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadMembers() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const response = await fetchMembers(page, MEMBERS_PAGE_SIZE);

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
  }, [page, role, t]);

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
    errorMessage,
    isLoading,
    members,
    page,
    pendingMembers,
    setPage,
    totalMembers,
    totalPages,
  };
}
