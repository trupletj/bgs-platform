import { toDateOnlyString } from "@/lib/format-attendance";
import type {
  DutyState,
  RosterCalendarDay,
  RosterCycle,
  RosterStatusOverview,
  RotationPattern,
  ShiftType,
  TodayShift,
  WorkerProfileLite,
} from "@/types/attendance";
import { getShiftLabel } from "@/lib/roster-helpers";

export type ScenarioKey =
  | "day-active"
  | "day-not-checked-in"
  | "day-finished"
  | "day-late"
  | "day-early-left"
  | "night-active"
  | "night-not-checked-in"
  | "resting-mid"
  | "resting-near-end"
  | "transition-day-to-night";

export const SCENARIO_KEYS: ScenarioKey[] = [
  "day-active",
  "day-not-checked-in",
  "day-finished",
  "day-late",
  "day-early-left",
  "night-active",
  "night-not-checked-in",
  "resting-mid",
  "resting-near-end",
  "transition-day-to-night",
];

export const SCENARIO_LABELS: Record<ScenarioKey, string> = {
  "day-active": "Өдрийн ээлж · Идэвхтэй",
  "day-not-checked-in": "Өдрийн ээлж · Бүртгэгдээгүй",
  "day-finished": "Өдрийн ээлж · Гарсан",
  "day-late": "Өдрийн ээлж · Хоцорсон",
  "day-early-left": "Өдрийн ээлж · Эрт тарсан",
  "night-active": "Шөнийн ээлж · Идэвхтэй",
  "night-not-checked-in": "Шөнийн ээлж · Бүртгэгдээгүй",
  "resting-mid": "Амралт · Дунд",
  "resting-near-end": "Амралт · Дуусахад ойрхон",
  "transition-day-to-night": "Шилжилт: Өдөр → Шөнө",
};

const DEFAULT_SCENARIO: ScenarioKey = "day-active";

function isScenarioKey(value: string | undefined): value is ScenarioKey {
  return !!value && (SCENARIO_KEYS as string[]).includes(value);
}

// ─────────────────────────────────────────────────────────────────────
// Утсаны helpers
// ─────────────────────────────────────────────────────────────────────

const DAY_NAMES = ["Ня", "Да", "Мя", "Лх", "Пү", "Ба", "Бя"];

function addDays(d: Date, days: number): Date {
  const next = new Date(d);
  next.setDate(next.getDate() + days);
  next.setHours(0, 0, 0, 0);
  return next;
}

function withTime(d: Date, hours: number, minutes = 0): string {
  // Return ISO local string without timezone — formatTime ашиглахад зориулсан
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  const hh = hours.toString().padStart(2, "0");
  const mm = minutes.toString().padStart(2, "0");
  return `${y}-${m}-${day}T${hh}:${mm}:00`;
}

const WORKER: WorkerProfileLite = {
  fullName: "Бат-Эрдэнэ Болд",
  position: "Ачааны машинч",
  department: "Уурхайн ашиглалтын алба",
  shiftGroup: "А ээлжийн бүлэг",
};

// ─────────────────────────────────────────────────────────────────────
// Scenario config
// ─────────────────────────────────────────────────────────────────────

interface ScenarioConfig {
  pattern: RotationPattern;
  cycleDay: number; // 1..28
  state: DutyState;
  // Жинхэнэ цаг (зөвхөн on-duty үед хэрэгтэй). null үед "—" харагдана.
  actualStart: { h: number; m: number } | null;
  actualEnd: { h: number; m: number } | null;
}

const SCENARIO_CONFIG: Record<ScenarioKey, ScenarioConfig> = {
  "day-active": {
    pattern: "day-only",
    cycleDay: 3,
    state: "active",
    actualStart: { h: 7, m: 58 },
    actualEnd: null,
  },
  "day-not-checked-in": {
    pattern: "day-only",
    cycleDay: 5,
    state: "not-checked-in",
    actualStart: null,
    actualEnd: null,
  },
  "day-finished": {
    pattern: "day-only",
    cycleDay: 7,
    state: "finished",
    actualStart: { h: 7, m: 55 },
    actualEnd: { h: 20, m: 7 },
  },
  "day-late": {
    pattern: "day-only",
    cycleDay: 4,
    state: "late",
    actualStart: { h: 8, m: 32 },
    actualEnd: null,
  },
  "day-early-left": {
    pattern: "day-only",
    cycleDay: 6,
    state: "early-left",
    actualStart: { h: 8, m: 0 },
    actualEnd: { h: 17, m: 45 },
  },
  "night-active": {
    pattern: "day-then-night",
    cycleDay: 10, // 8..14 → шөнийн фаз
    state: "active",
    actualStart: { h: 19, m: 58 },
    actualEnd: null,
  },
  "night-not-checked-in": {
    pattern: "day-then-night",
    cycleDay: 9,
    state: "not-checked-in",
    actualStart: null,
    actualEnd: null,
  },
  "resting-mid": {
    pattern: "day-then-night",
    cycleDay: 21, // 15..28 → амралт, дунд
    state: "resting",
    actualStart: null,
    actualEnd: null,
  },
  "resting-near-end": {
    pattern: "day-only",
    cycleDay: 27, // амралт дуусахад 2 хоног үлдсэн
    state: "resting",
    actualStart: null,
    actualEnd: null,
  },
  "transition-day-to-night": {
    pattern: "day-then-night",
    cycleDay: 8, // өдөр → шөнө шилжилтийн эхний өдөр
    state: "active",
    actualStart: { h: 19, m: 55 },
    actualEnd: null,
  },
};

// ─────────────────────────────────────────────────────────────────────
// Builders
// ─────────────────────────────────────────────────────────────────────

function deriveShiftType(
  pattern: RotationPattern,
  cycleDay: number,
): ShiftType | null {
  if (cycleDay > 14) return null; // off-duty
  if (pattern === "day-only") return "day";
  return cycleDay <= 7 ? "day" : "night";
}

function buildCycle(
  pattern: RotationPattern,
  cycleDay: number,
  today: Date,
): RosterCycle {
  const cycleStartDate = addDays(today, -(cycleDay - 1));
  const phase: "on-duty" | "off-duty" = cycleDay <= 14 ? "on-duty" : "off-duty";
  const phaseStartDate =
    phase === "on-duty" ? cycleStartDate : addDays(cycleStartDate, 14);
  const phaseEndDate = addDays(phaseStartDate, 13); // inclusive
  const nextPhaseStart = addDays(phaseEndDate, 1);
  const daysIntoPhase =
    phase === "on-duty" ? cycleDay : cycleDay - 14; // 1..14
  const daysRemainingPhase = 14 - daysIntoPhase;
  return {
    pattern,
    cycleStart: toDateOnlyString(cycleStartDate),
    cycleDay,
    phase,
    phaseStart: toDateOnlyString(phaseStartDate),
    phaseEnd: toDateOnlyString(phaseEndDate),
    daysIntoPhase,
    daysRemainingPhase,
    nextPhaseStart: toDateOnlyString(nextPhaseStart),
    nextPhaseLabel:
      phase === "on-duty" ? "Амралт эхэлнэ" : "Ажилд гарна",
  };
}

function buildToday(
  config: ScenarioConfig,
  today: Date,
): TodayShift {
  const shiftType = deriveShiftType(config.pattern, config.cycleDay);
  const label = getShiftLabel(shiftType);

  if (shiftType === null) {
    return {
      type: null,
      label,
      scheduledStart: null,
      scheduledEnd: null,
      actualStart: null,
      actualEnd: null,
      workedMinutes: null,
      state: "resting",
    };
  }

  // Scheduled цаг
  const scheduledStart =
    shiftType === "day" ? withTime(today, 8, 0) : withTime(today, 20, 0);
  // Шөнийн ээлжийн дуусах цаг маргаашийн 08:00
  const scheduledEnd =
    shiftType === "day"
      ? withTime(today, 20, 0)
      : withTime(addDays(today, 1), 8, 0);

  // Actual цаг
  const actualStart = config.actualStart
    ? withTime(today, config.actualStart.h, config.actualStart.m)
    : null;

  // Шөнийн ээлжийн жинхэнэ гарах цаг (хэрэв байгаа бол) маргааш-д.
  // MVP-д null үлдээж байна — finished scenario нь өдрийн ээлжид л байгаа.
  const actualEnd = config.actualEnd
    ? withTime(today, config.actualEnd.h, config.actualEnd.m)
    : null;

  let workedMinutes: number | null = null;
  if (actualStart && actualEnd) {
    const startMs = new Date(actualStart).getTime();
    const endMs = new Date(actualEnd).getTime();
    workedMinutes = Math.round((endMs - startMs) / 60000);
  } else if (actualStart && !actualEnd && config.state === "active") {
    // Идэвхтэй үед "одоо хүртэл" гэсэн ажилласан минут — UI live clock-аас бодно
    workedMinutes = null;
  }

  return {
    type: shiftType,
    label,
    scheduledStart,
    scheduledEnd,
    actualStart,
    actualEnd,
    workedMinutes,
    state: config.state,
  };
}

function buildCalendar(
  pattern: RotationPattern,
  cycleStartStr: string,
  today: Date,
): RosterCalendarDay[] {
  const cycleStart = new Date(`${cycleStartStr}T00:00:00`);
  const todayStr = toDateOnlyString(today);
  const days: RosterCalendarDay[] = [];

  // 29 өдөр: today-14 ... today+14 (нэг ростер цикл)
  const start = addDays(today, -14);
  for (let i = 0; i < 29; i++) {
    const d = addDays(start, i);
    const dateStr = toDateOnlyString(d);

    // Энэ өдөр одоогийн cycle-аас хэддэх cycle-д харьяалагдах вэ?
    const dayDiff = Math.round(
      (d.getTime() - cycleStart.getTime()) / 86400000,
    );
    const cycleIdx = ((dayDiff % 28) + 28) % 28; // 0..27
    const cycleDay = cycleIdx + 1; // 1..28

    const phase: "on-duty" | "off-duty" =
      cycleDay <= 14 ? "on-duty" : "off-duty";
    const shiftType: ShiftType | null =
      phase === "off-duty"
        ? null
        : pattern === "day-only"
          ? "day"
          : cycleDay <= 7
            ? "day"
            : "night";

    days.push({
      date: dateStr,
      dayOfMonth: d.getDate(),
      dayLabel: DAY_NAMES[d.getDay()],
      phase,
      shiftType,
      isToday: dateStr === todayStr,
      isCycleStart: cycleDay === 1,
      transition: null,
    });
  }

  // Transition: phase солигдсон өдөр (өчигдөр off → өнөөдөр on = arrival; гэх мэт)
  for (let i = 0; i < days.length; i++) {
    const prev = i > 0 ? days[i - 1] : null;
    const next = i < days.length - 1 ? days[i + 1] : null;
    if (days[i].phase === "on-duty") {
      if (!prev || prev.phase === "off-duty") {
        days[i].transition = "arrival";
      } else if (!next || next.phase === "off-duty") {
        days[i].transition = "departure";
      }
    }
  }
  return days;
}

// ─────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────

export function getDummyRosterStatus(
  scenarioParam?: string,
  nowOverride?: Date,
): { scenario: ScenarioKey; overview: RosterStatusOverview } {
  const scenario: ScenarioKey = isScenarioKey(scenarioParam)
    ? scenarioParam
    : DEFAULT_SCENARIO;
  const config = SCENARIO_CONFIG[scenario];
  const today = nowOverride ?? new Date();

  const cycle = buildCycle(config.pattern, config.cycleDay, today);
  const todayShift = buildToday(config, today);
  const calendar = buildCalendar(config.pattern, cycle.cycleStart, today);

  return {
    scenario,
    overview: {
      worker: WORKER,
      today: todayShift,
      cycle,
      calendar,
    },
  };
}
