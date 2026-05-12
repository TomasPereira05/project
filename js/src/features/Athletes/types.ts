export type TeamCategory =
  | "SENIORES"
  | "VETERANOS"
  | "JUNIORES"
  | "JUVENIS"
  | "INICIADOS"
  | "BENJAMINS_10"
  | "BENJAMINS_9"
  | "TRAQUINAS"
  | "PETIZES"
  | "FEMININO_FUT11"
  | "FEMININO_FUT7_9";

export type GuardianRole = "FATHER" | "MOTHER" | "LEGAL_GUARDIAN";

export type TeamCatalogCategory = {
  teamId: number;
  teamGroupId: number;
  code: string;
  label: string;
  active: boolean;
  sortOrder: number | null;
};

export type TeamGroup = {
  teamGroupId: number;
  code: string;
  label: string;
  active: boolean;
  sortOrder: number | null;
};

export type Guardian = {
  guardianId: number;
  athleteId: number;
  memberId: number | null;
  name: string;
  role: GuardianRole;
  kinship: string;
  email: string;
  phone: string;
  work: string;
  isPrimary: boolean;
  hasFamilyInClub: boolean;
};

export type AthleteFormValues = {
  teamCategory: TeamCategory;
  school: string;
  schoolYear: string;
  schoolClass: string;
};

export type AthleteRegisterValues = {
  memberId: string;
  nationality: string;
  birthplace: string;
  birthdate: string;
  email: string;
  phone: string;
  postalCode: string;
  address: string;
  city: string;
  state: string;
  niss: string;
  nif: string;
  numeroUtente: string;
  bi: string;
  biExpirationDate: string;
  school: string;
  schoolYear: string;
  schoolClass: string;
  lastClub: string;
  season: string;
  teamCategory: TeamCategory;
  guardianName: string;
  guardianRole: GuardianRole;
  guardianKinship: string;
  guardianEmail: string;
  guardianPhone: string;
  guardianWork: string;
  guardianHasFamilyInClub: boolean;
  privacyAccepted: boolean;
  comsAccepted: boolean;
  schoolCertificationAccepted: boolean;
};

export type Athlete = {
  athleteId: number;
  memberId: number;
  nationality: string;
  birthplace: string;
  birthdate: string;
  email: string;
  phone: string;
  postalCode: string;
  address: string;
  city: string;
  state: string;
  niss: string;
  nif: string;
  numeroUtente: string;
  bi: string;
  biExpirationDate: string;
  school: string | null;
  schoolYear: string | null;
  schoolClass: string | null;
  lastClub: string | null;
  season: string | null;
  teamCategory: TeamCategory;
  active: boolean;
  privacyAccepted: boolean;
  comsAccepted: boolean;
  schoolCertificationAccepted: boolean;
  guardians: Guardian[];
};

