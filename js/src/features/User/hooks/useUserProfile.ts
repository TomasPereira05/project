import { useEffect, useState } from "react";
import { fetchMember, type Member } from "../../Members";
import { getMyAthlete, type AthleteAdmin } from "../../Athletes";

export function useUserProfile(activeMemberId: number | null | undefined) {
  const [member, setMember] = useState<Member | null>(null);
  const [athlete, setAthlete] = useState<AthleteAdmin | null>(null);

  useEffect(() => {
    let ignore = false;

    if (!activeMemberId) {
      setMember(null);
      setAthlete(null);
      return;
    }

    fetchMember(activeMemberId)
      .then((res) => {
        if (!ignore) setMember(res);
      })
      .catch(() => {
        if (!ignore) setMember(null);
      });

    getMyAthlete()
      .then((res) => {
        if (!ignore) setAthlete(res);
      })
      .catch(() => {
        if (!ignore) setAthlete(null);
      });

    return () => {
      ignore = true;
    };
  }, [activeMemberId]);

  return { member, athlete };
}
