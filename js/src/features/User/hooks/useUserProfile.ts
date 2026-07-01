import { useEffect, useState } from "react";
import { fetchMember, type Member } from "../../Members";
import { getManagedAthletes, getMyAthlete, type AthleteAdmin, type ManagedAthlete } from "../../Athletes";

export function useUserProfile(activeMemberId: number | null | undefined) {
  const [member, setMember] = useState<Member | null>(null);
  const [athlete, setAthlete] = useState<AthleteAdmin | null>(null);
  const [managedAthletes, setManagedAthletes] = useState<ManagedAthlete[]>([]);

  useEffect(() => {
    let ignore = false;

    if (!activeMemberId) {
      setMember(null);
      setAthlete(null);
      return;
    }

    fetchMember(activeMemberId)
      .then((res) => {
        if (ignore) return;
        setMember(res);
        // Só pedimos o atleta do próprio quando o member é de facto um atleta;
        // para sócios normais /athletes/me devolveria sempre 404 (ruído na consola).
        if (res.category === "ATLETA_SOCIO") {
          getMyAthlete()
            .then((athleteRes) => {
              if (!ignore) setAthlete(athleteRes);
            })
            .catch(() => {
              if (!ignore) setAthlete(null);
            });
        } else {
          setAthlete(null);
        }
      })
      .catch(() => {
        if (!ignore) {
          setMember(null);
          setAthlete(null);
        }
      });

    return () => {
      ignore = true;
    };
  }, [activeMemberId]);

  // Atletas geridos pela conta (via user_athlete no backend); não depende do activeMemberId
  // (um encarregado sem conta de sócio também os tem de ver).
  useEffect(() => {
    let ignore = false;

    getManagedAthletes()
      .then((res) => {
        if (!ignore) setManagedAthletes(res);
      })
      .catch(() => {
        if (!ignore) setManagedAthletes([]);
      });

    return () => {
      ignore = true;
    };
  }, []);

  return { member, athlete, managedAthletes };
}
