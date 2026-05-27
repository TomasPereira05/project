import { useEffect, useMemo, useState } from "react";
import type { TFunction } from "i18next";
import { deactivateAthlete, fetchAllTeamCategories, listAllAdmin } from "../api";
import type { AthleteAdmin, AthleteStatus, TeamCatalogCategory } from "../types";
import { getVisibleTeamCategories } from "../utils";

export const ATHLETES_PAGE_SIZE = 8;
const SEARCH_DEBOUNCE_MS = 500;

/** Estados oferecidos no filtro, pela ordem em que aparecem no painel. */
export const ATHLETE_STATUS_OPTIONS: AthleteStatus[] = ["ATIVO", "PENDENTE", "INATIVO", "REJEITADO"];

export function useAthletesList(t: TFunction<"translation", undefined>) {
  const [athletes, setAthletes] = useState<AthleteAdmin[]>([]);
  const [page, setPage] = useState(1);
  const [totalAthletes, setTotalAthletes] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<AthleteStatus[]>([]);
  const [selectedTeamCategoryIds, setSelectedTeamCategoryIds] = useState<number[]>([]);
  const [teamCategories, setTeamCategories] = useState<TeamCatalogCategory[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeout);
  }, [searchTerm]);

  // Escalões para as checkboxes do filtro. Se falhar, o filtro de escalão fica vazio
  // mas a listagem continua a funcionar.
  useEffect(() => {
    let ignore = false;

    fetchAllTeamCategories()
      .then((categories) => {
        if (!ignore) setTeamCategories(getVisibleTeamCategories(categories, false));
      })
      .catch(() => {
        /* sem escalões disponíveis no filtro */
      });

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadAthletes() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const response = await listAllAdmin(page, ATHLETES_PAGE_SIZE, {
          search: debouncedSearchTerm,
          teamCategoryIds: selectedTeamCategoryIds,
          statuses: selectedStatuses,
        });
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
  }, [page, debouncedSearchTerm, refreshKey, selectedStatuses, selectedTeamCategoryIds, t]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const pendingAthletes = useMemo(
    () => athletes.filter((a) => a.status === "PENDENTE"),
    [athletes],
  );

  const activeFilterCount = selectedStatuses.length + selectedTeamCategoryIds.length;

  function toggleStatus(status: AthleteStatus) {
    setSelectedStatuses((current) =>
      current.includes(status) ? current.filter((s) => s !== status) : [...current, status],
    );
    setPage(1);
  }

  function toggleTeamCategory(teamId: number) {
    setSelectedTeamCategoryIds((current) =>
      current.includes(teamId) ? current.filter((id) => id !== teamId) : [...current, teamId],
    );
    setPage(1);
  }

  function clearFilters() {
    setSelectedStatuses([]);
    setSelectedTeamCategoryIds([]);
    setPage(1);
  }

  async function deactivate(athleteId: number) {
    try {
      await deactivateAthlete(athleteId);
      setRefreshKey((current) => current + 1);
    } catch {
      setErrorMessage(t("athletes.list.errors.deactivate"));
    }
  }

  return {
    athletes,
    errorMessage,
    isLoading,
    page,
    pendingAthletes,
    setPage,
    totalAthletes,
    totalPages,
    searchTerm,
    setSearchTerm,
    selectedStatuses,
    toggleStatus,
    selectedTeamCategoryIds,
    toggleTeamCategory,
    teamCategories,
    clearFilters,
    deactivate,
    activeFilterCount,
  };
}
