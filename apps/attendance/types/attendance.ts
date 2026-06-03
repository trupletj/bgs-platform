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

// ─────────────────────────────────────────────────────────────────────────
// Shift / Roster status model — mining roster дээр суурилсан mini-app UI
// ─────────────────────────────────────────────────────────────────────────

export type ShiftType = "day" | "night";

export type RotationPattern =
  | "day-only" // 14 хоног бүгд өдрийн ээлж
  | "day-then-night"; // 7 хоног өдөр → 7 хоног шөнө

export type RosterPhase = "on-duty" | "off-duty";

export type DutyState =
  | "not-checked-in"
  | "active"
  | "finished"
  | "late"
  | "early-left"
  | "absent"
  | "resting";

export interface TodayShift {
  type: ShiftType | null; // null = амралтын өдөр
  label: string; // "Өдрийн ээлж" / "Шөнийн ээлж" / "Амралт"
  scheduledStart: string | null; // ISO local "2026-05-31T08:00:00"
  scheduledEnd: string | null;
  actualStart: string | null;
  actualEnd: string | null;
  workedMinutes: number | null;
  state: DutyState;
}

export interface RosterCycle {
  pattern: RotationPattern;
  cycleStart: string; // YYYY-MM-DD — 28-хоногийн tour-ын эхлэл
  cycleDay: number; // 1..28
  phase: RosterPhase;
  phaseStart: string; // YYYY-MM-DD
  phaseEnd: string; // YYYY-MM-DD (inclusive)
  daysIntoPhase: number; // 1..14
  daysRemainingPhase: number; // 0..13
  nextPhaseStart: string; // YYYY-MM-DD
  nextPhaseLabel: string; // "Амралт эхлэнэ" / "Ажилд гарна"
}

export type RosterTransition = "arrival" | "departure";

export interface RosterCalendarDay {
  date: string; // YYYY-MM-DD
  dayOfMonth: number;
  dayLabel: string; // "Да"
  phase: RosterPhase;
  shiftType: ShiftType | null;
  isToday: boolean;
  isCycleStart: boolean;
  transition?: RosterTransition | null;
  // Past / on-duty өдрийн дэлгэрэнгүй (click дээр харуулна)
  isLate?: boolean;
  isEarlyLeft?: boolean;
  scheduledStart?: string | null;
  scheduledEnd?: string | null;
  actualStart?: string | null;
  actualEnd?: string | null;
  workedMinutes?: number | null;
}

export interface WorkerProfileLite {
  fullName: string;
  position: string;
  department: string;
  shiftGroup: string;
}

export interface RosterStatusOverview {
  worker: WorkerProfileLite;
  today: TodayShift;
  cycle: RosterCycle;
  calendar: RosterCalendarDay[];
}
