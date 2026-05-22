import { useEffect, useMemo, useState } from "react";
import type { TFunction } from "i18next";
import { fetchAllTeamCategories, listByCategory } from "../api";
import type { Athlete, TeamCatalogCategory } from "../types";

export function useAthletesByCategory(
  teamCategory: string | undefined,
  t: TFunction<"translation", undefined>,
) {
  const [category, setCategory] = useState<TeamCatalogCategory | null>(null);
  const [categoryUnknown, setCategoryUnknown] = useState(false);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let ignore = false;

    async function load() {
      setIsLoading(true);
      setErrorMessage("");
      setCategoryUnknown(false);

      if (!teamCategory) {
        if (!ignore) {
          setCategoryUnknown(true);
          setIsLoading(false);
        }
        return;
      }

      try {
        const allCategories = await fetchAllTeamCategories();
        const matched = allCategories.find((c) => c.code === teamCategory);
        if (!matched) {
          if (!ignore) {
            setCategoryUnknown(true);
            setIsLoading(false);
          }
          return;
        }

        const response = await listByCategory(matched.teamId);
        if (!ignore) {
          setCategory(matched);
          setAthletes(response);
        }
      } catch {
        if (!ignore) {
          setErrorMessage(t("athletes.list.errors.load"));
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      ignore = true;
    };
  }, [teamCategory, t]);

  const heading = useMemo(() => {
    if (category) return t("athletes.category.heading", { category: category.label });
    return t("athletes.category.unknown");
  }, [category, t]);

  return { athletes, category, categoryUnknown, errorMessage, heading, isLoading };
}
