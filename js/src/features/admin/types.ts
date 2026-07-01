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
