import { useEffect, useMemo, useState } from "react";
import type { TFunction } from "i18next";
import { listAllAdmin } from "../api";
import type { AthleteAdmin } from "../types";

export const ATHLETES_PAGE_SIZE = 8;

export function useAthletesList(t: TFunction<"translation", undefined>) {
  const [athletes, setAthletes] = useState<AthleteAdmin[]>([]);
  const [page, setPage] = useState(1);
  const [totalAthletes, setTotalAthletes] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadAthletes() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const response = await listAllAdmin(page, ATHLETES_PAGE_SIZE);
        if (!ignore) {
          setAthletes(response.items);
          setTotalAthletes(response.total);
          setTotalPages(response.totalPages);
        }
      } catch {
        if (!ignore) {
          setErrorMessage(t("athletes.list.errors.load"));
        }
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    loadAthletes();
    return () => {
      ignore = true;
    };
  }, [page, t]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const pendingAthletes = useMemo(
    () => athletes.filter((a) => a.status === "PENDENTE"),
    [athletes],
  );

  return {
    athletes,
    errorMessage,
    isLoading,
    page,
    pendingAthletes,
    setPage,
    totalAthletes,
    totalPages,
  };
}
