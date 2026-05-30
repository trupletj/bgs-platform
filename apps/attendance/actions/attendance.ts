"use server";

import { cache } from "react";
import { createClient } from "@/utils/supabase/server";
import type {
  AttendanceDay,
  AttendanceDayStatus,
  AttendanceDayWithOverride,
  AttendanceOverviewResult,
  AttendanceWeekDayCell,
  AttendanceWeekOverview,
  AttendanceWeekResult,
} from "@/types/attendance";
import {
  currentWeekEnd,
  currentWeekStart,
  formatMonth,
  getDayName,
  monthFirstDay,
  toDateOnlyString,
  toMonthParam,
} from "@/lib/format-attendance";

type AttendanceRpcRow = {
  day_date?: unknown;
  work_start_at?: unknown;
  work_end_at?: unknown;
  work_duration?: unknown;
  status_id?: unknown;
  is_hotsorson?: unknown;
  is_ert_tarsan?: unknown;
  start_at?: unknown;
  end_at?: unknown;
  original_start_at?: unknown;
  original_end_at?: unknown;
  is_overridden?: unknown;
  pending_correction_id?: unknown;
};

function asString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return String(value);
}

function asNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function asBoolean(value: unknown): boolean {
  return Boolean(value);
}

function mapWithOverrideRow(row: unknown): AttendanceDayWithOverride {
  const r = row as AttendanceRpcRow;
  return {
    dayDate: String(r.day_date),
    workStartAt: asString(r.work_start_at),
    workEndAt: asString(r.work_end_at),
    workDuration: asNumber(r.work_duration),
    statusId: asNumber(r.status_id),
    isHotsorson: asBoolean(r.is_hotsorson),
    isErtTarsan: asBoolean(r.is_ert_tarsan),
    startAt: asString(r.start_at),
    endAt: asString(r.end_at),
    originalStartAt: asString(r.original_start_at),
    originalEndAt: asString(r.original_end_at),
    isOverridden: asBoolean(r.is_overridden),
    pendingCorrectionId: asString(r.pending_correction_id),
  };
}

const getAttendanceCached = cache(async (): Promise<AttendanceDay[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_my_attendance");
  if (error) {
    console.error("[attendance] get_my_attendance failed:", error.message);
    return [];
  }
  return ((data as unknown[]) ?? []).map((row) => {
    const r = row as AttendanceRpcRow;
    return {
      dayDate: String(r.day_date),
      workStartAt: asString(r.work_start_at),
      workEndAt: asString(r.work_end_at),
      workDuration: asNumber(r.work_duration),
      statusId: asNumber(r.status_id),
      isHotsorson: asBoolean(r.is_hotsorson),
      isErtTarsan: asBoolean(r.is_ert_tarsan),
      startAt: asString(r.start_at),
      endAt: asString(r.end_at),
    };
  });
});

export async function getMyAttendance14d() {
  return getAttendanceCached();
}

export async function getMyAttendanceForWeek(): Promise<AttendanceWeekResult> {
  const today = new Date();
  const todayStr = toDateOnlyString(today);
  const weekStartDate = currentWeekStart(today);
  const weekEndDate = currentWeekEnd(today);
  const weekStart = toDateOnlyString(weekStartDate);
  const weekEnd = toDateOnlyString(weekEndDate);

  const supabase = await createClient();

  // 7-хоног нь 2 сар хамарвал 2 удаа RPC дуудна (e.g. 5/29 - 6/4)
  const months = new Set<string>();
  months.add(toMonthParam(monthFirstDay(weekStartDate)));
  months.add(toMonthParam(monthFirstDay(weekEndDate)));

  const responses = await Promise.all(
    Array.from(months).map((monthParam) =>
      supabase.rpc("get_my_attendance_with_overrides", {
        p_month: `${monthParam}-01`,
      }),
    ),
  );

  const dayMap = new Map<string, AttendanceDayWithOverride>();
  for (const res of responses) {
    if (res.error) {
      console.error(
        "[attendance] get_my_attendance_with_overrides failed:",
        res.error.message,
      );
      continue;
    }
    for (const row of (res.data as unknown[]) ?? []) {
      const day = mapWithOverrideRow(row);
      if (day.dayDate >= weekStart && day.dayDate <= weekEnd) {
        dayMap.set(day.dayDate, day);
      }
    }
  }

  const today_ = dayMap.get(todayStr) ?? null;
  const pastDays = Array.from(dayMap.values())
    .filter((d) => d.dayDate < todayStr)
    .sort((a, b) => (a.dayDate < b.dayDate ? 1 : -1));

  return {
    weekStart,
    weekEnd,
    todayDate: todayStr,
    today: today_,
    pastDays,
  };
}

// ───────────────────────────────────────────────────────────────────
// Overview API — KPI + today + week grid (1 RPC call for current month)
// ───────────────────────────────────────────────────────────────────

function classifyDay(
  day: AttendanceDayWithOverride | undefined,
  dayDate: string,
  todayDate: string,
): AttendanceDayStatus {
  if (dayDate === todayDate) return "today";
  if (dayDate > todayDate) return "future";
  if (!day) return "weekend";
  if (day.isErtTarsan) return "early-left";
  if (day.isHotsorson) return "late";
  if (day.workStartAt) return "present";
  if (day.startAt) return "absent"; // scheduled but no check-in
  return "weekend";
}

export async function getMyAttendanceOverview(): Promise<AttendanceOverviewResult> {
  const today = new Date();
  const todayStr = toDateOnlyString(today);
  const weekStartDate = currentWeekStart(today);
  const weekEndDate = currentWeekEnd(today);
  const weekStart = toDateOnlyString(weekStartDate);
  const weekEnd = toDateOnlyString(weekEndDate);

  const supabase = await createClient();

  // Сар + долоо хоног хамарсан бүх RPC дуудлага (давтахгүй)
  const months = new Set<string>();
  months.add(toMonthParam(monthFirstDay(today)));
  months.add(toMonthParam(monthFirstDay(weekStartDate)));
  months.add(toMonthParam(monthFirstDay(weekEndDate)));

  const responses = await Promise.all(
    Array.from(months).map((m) =>
      supabase.rpc("get_my_attendance_with_overrides", {
        p_month: `${m}-01`,
      }),
    ),
  );

  const allDays = new Map<string, AttendanceDayWithOverride>();
  let hasBteg = true;
  let firstError = false;
  for (const res of responses) {
    if (res.error) {
      console.error("[attendance] overview RPC failed:", res.error.message);
      firstError = true;
      continue;
    }
    const data = (res.data as unknown[]) ?? [];
    if (data.length === 0) {
      continue;
    }
    for (const row of data) {
      const day = mapWithOverrideRow(row);
      allDays.set(day.dayDate, day);
    }
  }
  if (firstError && allDays.size === 0) {
    hasBteg = false;
  } else if (allDays.size === 0) {
    hasBteg = false;
  }

  // ── KPI scope = энэ сар (calendar month)
  const monthStart = toDateOnlyString(monthFirstDay(today));
  const monthDays = Array.from(allDays.values()).filter(
    (d) => d.dayDate >= monthStart && d.dayDate <= todayStr,
  );
  let workedDays = 0;
  let totalMinutes = 0;
  let scheduledDays = 0;
  for (const d of monthDays) {
    if (d.workStartAt) {
      workedDays += 1;
      if (d.workDuration && d.workDuration > 0) {
        totalMinutes += d.workDuration;
      }
    }
    if (d.startAt) scheduledDays += 1;
  }
  const attendancePercent =
    scheduledDays > 0 ? Math.round((workedDays / scheduledDays) * 100) : 0;

  // ── Today snapshot
  const todayDay = allDays.get(todayStr);
  const todaySnapshot = todayDay
    ? {
        dayDate: todayStr,
        dayLabel: getDayName(todayStr),
        workStartAt: todayDay.workStartAt,
        workEndAt: todayDay.workEndAt,
        workDuration: todayDay.workDuration,
        isHotsorson: todayDay.isHotsorson,
        isErtTarsan: todayDay.isErtTarsan,
        isOverridden: todayDay.isOverridden,
        pendingCorrectionId: todayDay.pendingCorrectionId,
        status: classifyDay(todayDay, todayStr, todayStr),
      }
    : hasBteg
      ? {
          dayDate: todayStr,
          dayLabel: getDayName(todayStr),
          workStartAt: null,
          workEndAt: null,
          workDuration: null,
          isHotsorson: false,
          isErtTarsan: false,
          isOverridden: false,
          pendingCorrectionId: null,
          status: "today" as AttendanceDayStatus,
        }
      : null;

  // ── Week grid: weekStart..weekEnd
  const weekCells: AttendanceWeekDayCell[] = [];
  let cursor = new Date(weekStartDate);
  let weekPresent = 0;
  let weekAbsent = 0;
  let weekLate = 0;
  let weekMinutes = 0;
  while (cursor <= weekEndDate) {
    const dayStr = toDateOnlyString(cursor);
    const day = allDays.get(dayStr);
    const status = classifyDay(day, dayStr, todayStr);
    weekCells.push({
      dayDate: dayStr,
      dayLabel: getDayName(dayStr),
      dayOfMonth: cursor.getDate(),
      status,
      workStartAt: day?.workStartAt ?? null,
      workEndAt: day?.workEndAt ?? null,
      workDuration: day?.workDuration ?? null,
      isToday: dayStr === todayStr,
    });
    if (status === "present") weekPresent += 1;
    if (status === "late" || status === "early-left") weekLate += 1;
    if (status === "absent") weekAbsent += 1;
    if (day?.workDuration && day.workDuration > 0)
      weekMinutes += day.workDuration;
    cursor = new Date(cursor.getTime() + 86400000);
  }

  const weekLabel = formatWeekLabel(weekStartDate, weekEndDate);

  const week: AttendanceWeekOverview = {
    weekStart,
    weekEnd,
    weekLabel,
    days: weekCells,
    summary: {
      presentDays: weekPresent,
      absentDays: weekAbsent,
      lateDays: weekLate,
      totalMinutes: weekMinutes,
    },
  };

  return {
    kpi: {
      workedDays,
      totalMinutes,
      attendancePercent,
      scopeLabel: formatMonth(today),
    },
    today: todaySnapshot,
    week,
    hasBteg,
  };
}

function formatWeekLabel(start: Date, end: Date): string {
  const sameMonth = start.getMonth() === end.getMonth();
  const year = end.getFullYear();
  const monthMn = formatMonth(start).split(" оны ")[1] ?? "";
  if (sameMonth) {
    return `${year} оны ${monthMn}, ${start.getDate()}-${end.getDate()}`;
  }
  const endMonth = formatMonth(end).split(" оны ")[1] ?? "";
  return `${year} оны ${monthMn} ${start.getDate()} – ${endMonth} ${end.getDate()}`;
}
