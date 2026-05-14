export type GuardianRole = "FATHER" | "MOTHER" | "LEGAL_GUARDIAN";

/** Status visual do atleta, derivado de (member.status, athlete.active) no backend. */
export type AthleteStatus = "PENDENTE" | "ATIVO" | "INATIVO" | "REJEITADO";

/** Shape padrão de resposta paginada — espelha `service.Page<T>` no backend. */
export type PaginatedResponse<T> = {
  items: T[];
  page: number;
  size: number;
  total: number;
  totalPages: number;
};

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

/** Espelha `MemberOutput` no backend. Usado dentro de `AthleteAdmin.member`. */
export type MemberOutput = {
  memberId: number;
  memberNumber: number;
  completeName: string;
  birthDate: string;
  birthplace: string | null;
  email: string;
  phone: string;
  homePhone: string | null;
  address: string;
  postalCode: string;
  city: string;
  nif: string;
  category: string;
  formerMember: boolean;
  status: string;
  membershipQuota: number;
  billingLocation: string | null;
  registrationDate: string;
  approvalDate: string | null;
  privacyAccepted: boolean;
  comsAccepted: boolean;
};

export type Guardian = {
  guardianId: number;
  name: string;
  role: GuardianRole;
  kinship: string | null;
  email: string;
  phone: string;
  professionalActivity: string | null;
  contactPhone: string | null;
};

export type GuardianInput = {
  name: string;
  role: GuardianRole;
  kinship: string | null;
  email: string;
  phone: string;
  professionalActivity: string | null;
  contactPhone: string | null;
  /** Nº Sócio (memberNumber) do encarregado, se for sócio. Backend resolve-o em memberId. */
  memberNumber?: number | null;
};

/** Listagem pública por categoria. Sem dados sensíveis. `idade` é calculada no backend. */
export type Athlete = {
  id: number;
  nome: string;
  numero: number | null;
  posicao: string | null;
  nacionalidade: string;
  idade: number | null;
  teamCategoryCode: string;
  teamCategoryLabel: string;
  fotoUrl: string | null;
};

/** Detalhe público do atleta. `idade` calculada — sem data de nascimento. */
export type AthleteDetail = {
  id: number;
  nome: string;
  numero: number | null;
  posicao: string | null;
  nacionalidade: string;
  idade: number | null;
  fotoUrl: string | null;
  teamCategoryCode: string;
  teamCategoryLabel: string;
  epocasRepresentadas: string[];
};

/** Detalhe / listagem para SECRETARIA/ADMIN. Inclui Member completo e guardians. */
export type AthleteAdmin = {
  athleteId: number;
  member: MemberOutput;
  nationality: string;
  niss: string;
  numeroUtente: string;
  bi: string;
  biExpirationDate: string;
  school: string | null;
  schoolYear: string | null;
  schoolClass: string | null;
  lastClub: string | null;
  season: string | null;
  teamCategoryId: number;
  teamCategoryCode: string;
  teamCategoryLabel: string;
  jerseyNumber: number | null;
  position: string | null;
  photoUrl: string | null;
  hasFamilyInClub: boolean;
  schoolCertificationAccepted: boolean;
  active: boolean;
  status: AthleteStatus;
  guardians: Guardian[];
};

/** Body de POST /api/athletes. Espelha o formulário completo. */
export type AthleteInput = {
  // Dados pessoais (vão para Member)
  completeName: string;
  birthDate: string;
  birthplace: string | null;
  email: string;
  phone: string;
  homePhone: string | null;
  address: string;
  postalCode: string;
  city: string;
  nif: string;
  privacyAccepted: boolean;
  comsAccepted: boolean;
  // Dados atléticos
  nationality: string;
  niss: string;
  numeroUtente: string;
  bi: string;
  biExpirationDate: string;
  school: string | null;
  schoolYear: string | null;
  schoolClass: string | null;
  lastClub: string | null;
  season: string | null;
  teamCategoryId: number;
  photoUrl: string | null;
  hasFamilyInClub: boolean;
  schoolCertificationAccepted: boolean;
  // Agregado familiar
  guardians: GuardianInput[];
  /** `true` se quem submete é o próprio atleta. Backend liga `member.user_id` à conta. */
  isSelfRegistration: boolean;
};

/** Body de PUT /api/athletes/{id}. Update administrativo. */
export type AthleteUpdateRequest = {
  jerseyNumber: number | null;
  position: string | null;
  photoUrl: string | null;
  school: string | null;
  schoolYear: string | null;
  schoolClass: string | null;
  lastClub: string | null;
  season: string | null;
  hasFamilyInClub: boolean;
  guardians?: GuardianInput[] | null;
};
