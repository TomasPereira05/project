export type AdminOverviewStats = {
  totalMembers: number;
  activeMembers: number;
  pendingMembers: number;
  totalAthletes: number;
  activeAthletes: number;
  pendingAthletes: number;
  totalSponsorships: number;
  pendingSponsorships: number;
  approvedUnpaidSponsorships: number;
  pendingCharges: number;
  todayTrainingSchedules: number;
  activeSeason: string | null;
};

export type PaginatedResponse<T> = {
  items: T[];
  page: number;
  size: number;
  total: number;
  totalPages: number;
};

export type AuditLog = {
  auditLogId: number;
  occurredAt: string;
  requestId: string;
  userId: number | null;
  username: string | null;
  role: string | null;
  action: string;
  method: string;
  path: string;
  queryString: string | null;
  statusCode: number;
  durationMs: number;
  ipAddress: string | null;
  userAgent: string | null;
  outcome: string;
  targetType: string | null;
  targetId: string | null;
  errorMessage: string | null;
};

export type Season = {
  seasonId: number;
  name: string;
  startsAt: string;
  endsAt: string;
  active: boolean;
};

export type SeasonInput = {
  seasonId?: number;
  name: string;
  startsAt: string;
  endsAt: string;
  active?: boolean;
};

export type TrainingSchedule = {
  trainingScheduleId: number;
  teamCategoryId: number;
  teamLabel: string;
  teamCode: string;
  season: string;
  weekday: number;
  startTime: string;
  endTime: string;
  fieldName: string;
  fieldZone: string | null;
  active: boolean;
  notes: string | null;
};

export type TrainingScheduleInput = {
  trainingScheduleId?: number;
  teamCategoryId: number;
  season: string;
  weekday: number;
  startTime: string;
  endTime: string;
  fieldName: string;
  fieldZone: string | null;
  active: boolean;
  notes: string | null;
};
