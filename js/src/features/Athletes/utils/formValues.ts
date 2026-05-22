import type { AthleteAdmin, AthleteInput, AthleteUpdateRequest, GuardianInput } from "../types";

export type AthleteUpdateForm = {
  teamCategoryId: number;
  jerseyNumber: string;
  position: string;
  photoUrl: string;
  school: string;
  schoolYear: string;
  schoolClass: string;
  lastClub: string;
  season: string;
  hasFamilyInClub: boolean;
};

export function stateFromAthlete(a: AthleteAdmin): AthleteUpdateForm {
  return {
    teamCategoryId: a.teamCategoryId,
    jerseyNumber: a.jerseyNumber !== null ? String(a.jerseyNumber) : "",
    position: a.position ?? "",
    photoUrl: a.photoUrl ?? "",
    school: a.school ?? "",
    schoolYear: a.schoolYear ?? "",
    schoolClass: a.schoolClass ?? "",
    lastClub: a.lastClub ?? "",
    season: a.season ?? "",
    hasFamilyInClub: a.hasFamilyInClub,
  };
}

export function toUpdateRequest(values: AthleteUpdateForm): AthleteUpdateRequest {
  const parsedJersey = values.jerseyNumber.trim() === "" ? null : Number(values.jerseyNumber);
  return {
    jerseyNumber: Number.isFinite(parsedJersey) ? (parsedJersey as number) : null,
    position: values.position.trim() || null,
    photoUrl: values.photoUrl.trim() || null,
    school: values.school.trim() || null,
    schoolYear: values.schoolYear.trim() || null,
    schoolClass: values.schoolClass.trim() || null,
    lastClub: values.lastClub.trim() || null,
    season: values.season.trim() || null,
    hasFamilyInClub: values.hasFamilyInClub,
  };
}

export type RegisterValues = {
  completeName: string;
  birthDate: string;
  birthplace: string;
  email: string;
  phone: string;
  homePhone: string;
  nif: string;
  address: string;
  postalCode: string;
  city: string;
  nationality: string;
  niss: string;
  numeroUtente: string;
  bi: string;
  biExpirationDate: string;
  photoUrl: string;
  teamCategoryId: string;
  lastClub: string;
  season: string;
  hasFamilyInClub: boolean;
  school: string;
  schoolYear: string;
  schoolClass: string;
  fatherName: string;
  fatherEmail: string;
  fatherPhone: string;
  fatherWork: string;
  motherName: string;
  motherEmail: string;
  motherPhone: string;
  motherWork: string;
  lgName: string;
  lgKinship: string;
  lgEmail: string;
  lgPhone: string;
  lgContactPhone: string;
  lgWork: string;
  lgMemberNumber: string;
  // Consentimentos
  privacyAccepted: boolean;
  comsAccepted: boolean;
  schoolCertificationAccepted: boolean;
  // Auto-inscrição (o próprio user é o atleta)
  isSelfRegistration: boolean;
};

export const initialRegisterValues: RegisterValues = {
  completeName: "",
  birthDate: "",
  birthplace: "",
  email: "",
  phone: "",
  homePhone: "",
  nif: "",
  address: "",
  postalCode: "",
  city: "",
  nationality: "",
  niss: "",
  numeroUtente: "",
  bi: "",
  biExpirationDate: "",
  photoUrl: "",
  teamCategoryId: "",
  lastClub: "",
  season: "",
  hasFamilyInClub: false,
  school: "",
  schoolYear: "",
  schoolClass: "",
  fatherName: "",
  fatherEmail: "",
  fatherPhone: "",
  fatherWork: "",
  motherName: "",
  motherEmail: "",
  motherPhone: "",
  motherWork: "",
  lgName: "",
  lgKinship: "",
  lgEmail: "",
  lgPhone: "",
  lgContactPhone: "",
  lgWork: "",
  lgMemberNumber: "",
  privacyAccepted: false,
  comsAccepted: false,
  schoolCertificationAccepted: false,
  isSelfRegistration: false,
};

function buildGuardians(values: RegisterValues): GuardianInput[] {
  const lgMemberNumber = values.lgMemberNumber.trim();
  return [
    {
      name: values.fatherName,
      role: "FATHER",
      kinship: null,
      email: values.fatherEmail,
      phone: values.fatherPhone,
      professionalActivity: values.fatherWork.trim(),
      contactPhone: null,
    },
    {
      name: values.motherName,
      role: "MOTHER",
      kinship: null,
      email: values.motherEmail,
      phone: values.motherPhone,
      professionalActivity: values.motherWork.trim(),
      contactPhone: null,
    },
    {
      name: values.lgName,
      role: "LEGAL_GUARDIAN",
      kinship: values.lgKinship,
      email: values.lgEmail,
      phone: values.lgPhone,
      professionalActivity: values.lgWork.trim() || null,
      contactPhone: values.lgContactPhone,
      memberNumber: lgMemberNumber ? Number(lgMemberNumber) : null,
    },
  ];
}

export function toAthleteInput(values: RegisterValues): AthleteInput {
  return {
    completeName: values.completeName,
    birthDate: values.birthDate,
    birthplace: values.birthplace.trim() || null,
    email: values.email,
    phone: values.phone,
    homePhone: values.homePhone.trim() || null,
    address: values.address,
    postalCode: values.postalCode,
    city: values.city,
    nif: values.nif,
    privacyAccepted: values.privacyAccepted,
    comsAccepted: values.comsAccepted,
    nationality: values.nationality,
    niss: values.niss,
    numeroUtente: values.numeroUtente,
    bi: values.bi,
    biExpirationDate: values.biExpirationDate,
    school: values.school.trim() || null,
    schoolYear: values.schoolYear.trim() || null,
    schoolClass: values.schoolClass.trim() || null,
    lastClub: values.lastClub.trim() || null,
    season: values.season.trim() || null,
    teamCategoryId: Number(values.teamCategoryId),
    photoUrl: values.photoUrl.trim() || null,
    hasFamilyInClub: values.hasFamilyInClub,
    schoolCertificationAccepted: values.schoolCertificationAccepted,
    guardians: buildGuardians(values),
    isSelfRegistration: values.isSelfRegistration,
  };
}
