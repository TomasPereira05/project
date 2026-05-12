import type { Athlete, AthleteFormValues, AthleteRegisterValues, TeamCategory } from "../types";

export const TEAM_CATEGORIES: TeamCategory[] = [
  "SENIORES",
  "VETERANOS",
  "JUNIORES",
  "JUVENIS",
  "INICIADOS",
  "BENJAMINS_10",
  "BENJAMINS_9",
  "TRAQUINAS",
  "PETIZES",
  "FEMININO_FUT11",
  "FEMININO_FUT7_9",
];

export function isTeamCategory(value: string): value is TeamCategory {
  return (TEAM_CATEGORIES as string[]).includes(value);
}

export function labelForCategory(category: TeamCategory) {
  switch (category) {
    case "SENIORES":
      return "Seniores";
    case "VETERANOS":
      return "Veteranos";
    case "JUNIORES":
      return "Juniores";
    case "JUVENIS":
      return "Juvenis";
    case "INICIADOS":
      return "Iniciados";
    case "BENJAMINS_10":
      return "Benjamins (10)";
    case "BENJAMINS_9":
      return "Benjamins (9)";
    case "TRAQUINAS":
      return "Traquinas";
    case "PETIZES":
      return "Petizes";
    case "FEMININO_FUT11":
      return "Feminino Fut11";
    case "FEMININO_FUT7_9":
      return "Feminino Fut7/9";
  }
}

export function defaultAthleteFormValues(athlete?: Athlete): AthleteFormValues {
  return {
    teamCategory: athlete?.teamCategory ?? "SENIORES",
    school: athlete?.school ?? "",
    schoolYear: athlete?.schoolYear ?? "",
    schoolClass: athlete?.schoolClass ?? "",
  };
}

export function defaultAthleteRegisterValues(): AthleteRegisterValues {
  return {
    memberId: "",
    nationality: "",
    birthplace: "",
    birthdate: "",
    email: "",
    phone: "",
    postalCode: "",
    address: "",
    city: "",
    state: "",
    niss: "",
    nif: "",
    numeroUtente: "",
    bi: "",
    biExpirationDate: "",
    school: "",
    schoolYear: "",
    schoolClass: "",
    lastClub: "",
    season: "",
    teamCategory: "SENIORES",
    guardianName: "",
    guardianRole: "FATHER",
    guardianKinship: "",
    guardianEmail: "",
    guardianPhone: "",
    guardianWork: "",
    guardianHasFamilyInClub: false,
    privacyAccepted: false,
    comsAccepted: false,
    schoolCertificationAccepted: false,
  };
}
