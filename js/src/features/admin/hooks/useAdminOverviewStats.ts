import { useEffect, useState } from "react";
import { fetchAdminOverviewStats, type AdminOverviewStats } from "../api";

const emptyStats: AdminOverviewStats = {
  totalMembers: 0,
  activeMembers: 0,
  pendingMembers: 0,
  totalAthletes: 0,
  activeAthletes: 0,
  pendingAthletes: 0,
  totalSponsorships: 0,
  pendingSponsorships: 0,
};

export function useAdminOverviewStats() {
  const [stats, setStats] = useState<AdminOverviewStats>(emptyStats);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function loadStats() {
      setIsLoading(true);
      setHasError(false);

      try {
        const response = await fetchAdminOverviewStats();

        if (!ignore) {
          setStats(response);
        }
      } catch {
        if (!ignore) {
          setHasError(true);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    void loadStats();

    return () => {
      ignore = true;
    };
  }, []);

  return { hasError, isLoading, stats };
}
