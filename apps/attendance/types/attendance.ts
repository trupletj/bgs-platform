export interface AttendanceDay {
  dayDate: string;
  workStartAt: string | null;
  workEndAt: string | null;
  workDuration: number | null;
  statusId: number | null;
  isHotsorson: boolean;
  isErtTarsan: boolean;
  startAt: string | null;
  endAt: string | null;
}

export interface AttendanceDayWithOverride extends AttendanceDay {
  originalStartAt: string | null;
  originalEndAt: string | null;
  isOverridden: boolean;
  pendingCorrectionId: string | null;
}

export interface AttendanceWeekResult {
  weekStart: string; // YYYY-MM-DD (Friday)
  weekEnd: string; // YYYY-MM-DD (next Thursday)
  todayDate: string; // YYYY-MM-DD
  today: AttendanceDayWithOverride | null;
  pastDays: AttendanceDayWithOverride[]; // weekStart..today-1, newest first
}

export type AttendanceDayStatus =
  | "present"
  | "late"
  | "early-left"
  | "absent"
  | "today"
  | "future"
  | "weekend";

export interface AttendanceWeekDayCell {
  dayDate: string;
  dayLabel: string; // "Да", "Мя", etc
  dayOfMonth: number;
  status: AttendanceDayStatus;
  workStartAt: string | null;
  workEndAt: string | null;
  workDuration: number | null;
  isToday: boolean;
}

export interface AttendanceWeekOverview {
  weekStart: string;
  weekEnd: string;
  weekLabel: string; // "2026 оны 5-р сар, 26-30"
  days: AttendanceWeekDayCell[];
  summary: {
    presentDays: number;
    absentDays: number;
    lateDays: number;
    totalMinutes: number;
  };
}

export interface AttendanceKpiSummary {
  workedDays: number;
  totalMinutes: number;
  attendancePercent: number; // 0..100
  scopeLabel: string; // "Энэ сар"
}

export interface AttendanceTodaySnapshot {
  dayDate: string;
  dayLabel: string;
  workStartAt: string | null;
  workEndAt: string | null;
  workDuration: number | null;
  isHotsorson: boolean;
  isErtTarsan: boolean;
  isOverridden: boolean;
  pendingCorrectionId: string | null;
  status: AttendanceDayStatus;
}

export interface AttendanceOverviewResult {
  kpi: AttendanceKpiSummary;
  today: AttendanceTodaySnapshot | null;
  week: AttendanceWeekOverview;
  hasBteg: boolean;
}
