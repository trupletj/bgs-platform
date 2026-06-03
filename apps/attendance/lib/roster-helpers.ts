import type {
  DutyState,
  RotationPattern,
  ShiftType,
} from "@/types/attendance";

export function getShiftLabel(type: ShiftType | null): string {
  if (type === "day") return "Өдрийн ээлж";
  if (type === "night") return "Шөнийн ээлж";
  return "Амралт";
}

export function getRotationLabel(pattern: RotationPattern): string {
  if (pattern === "day-only") return "14 хоног өдрийн ээлж";
  return "7 хоног өдөр + 7 хоног шөнө";
}

export interface DutyStateVisual {
  label: string;
  badgeClass: string;
}

const DUTY_STATE_VISUAL: Record<DutyState, DutyStateVisual> = {
  active: {
    label: "Идэвхтэй",
    badgeClass: "border-transparent bg-emerald-100 text-emerald-700",
  },
  finished: {
    label: "Гарсан",
    badgeClass: "border-transparent bg-emerald-50 text-emerald-700",
  },
  "not-checked-in": {
    label: "Бүртгэгдээгүй",
    badgeClass: "border-transparent bg-indigo-100 text-indigo-700",
  },
  late: {
    label: "Хоцорсон",
    badgeClass: "border-transparent bg-amber-100 text-amber-700",
  },
  "early-left": {
    label: "Эрт тарсан",
    badgeClass: "border-transparent bg-amber-100 text-amber-700",
  },
  absent: {
    label: "Тасалсан",
    badgeClass: "border-transparent bg-rose-100 text-rose-700",
  },
  resting: {
    label: "Амарч байна",
    badgeClass: "border-transparent bg-cyan-100 text-cyan-700",
  },
};

export function getDutyStateVisual(state: DutyState): DutyStateVisual {
  return DUTY_STATE_VISUAL[state];
}

const MONTH_DAY_FORMATTER = (dateStr: string): string => {
  const [, m, d] = dateStr.split("-");
  return `${m}-${d}`;
};

export function formatMonthDay(dateStr: string): string {
  return MONTH_DAY_FORMATTER(dateStr);
}

export function daysBetween(fromStr: string, toStr: string): number {
  const from = new Date(`${fromStr}T00:00:00`);
  const to = new Date(`${toStr}T00:00:00`);
  return Math.round((to.getTime() - from.getTime()) / 86400000);
}
