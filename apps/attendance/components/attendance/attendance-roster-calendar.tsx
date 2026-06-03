"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  Clock,
  PlaneLanding,
  PlaneTakeoff,
  X,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatTime } from "@/lib/format-attendance";
import { formatMonthDay } from "@/lib/roster-helpers";
import type { RosterCalendarDay } from "@/types/attendance";

const WEEK_HEADERS = ["Ня", "Да", "Мя", "Лх", "Пү", "Ба", "Бя"];

export function AttendanceRosterCalendar({
  calendar,
}: {
  calendar: RosterCalendarDay[];
}) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Хамгаалалт — давхар огноо орж ирвэл нэгийг л үлдээнэ
  const uniqueCalendar = useMemo(() => {
    const seen = new Set<string>();
    return calendar.filter((c) => {
      if (seen.has(c.date)) return false;
      seen.add(c.date);
      return true;
    });
  }, [calendar]);

  const cells = useMemo(() => {
    if (uniqueCalendar.length === 0) return [];
    const firstDow = new Date(`${uniqueCalendar[0].date}T00:00:00`).getDay();
    const padBefore: null[] = new Array(firstDow).fill(null);
    return [...padBefore, ...uniqueCalendar] as (RosterCalendarDay | null)[];
  }, [uniqueCalendar]);

  const selected = useMemo(
    () => uniqueCalendar.find((c) => c.date === selectedDate) ?? null,
    [uniqueCalendar, selectedDate],
  );

  // body scroll-ийг drawer нээлттэй үед түгжинэ
  useEffect(() => {
    if (!selected) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [selected]);

  if (uniqueCalendar.length === 0) return null;

  const hasArrival = uniqueCalendar.some((c) => c.transition === "arrival");
  const hasDeparture = uniqueCalendar.some((c) => c.transition === "departure");
  const hasLate = uniqueCalendar.some(
    (c) => c.phase === "on-duty" && c.isLate && Boolean(c.actualStart),
  );
  const hasEarly = uniqueCalendar.some(
    (c) => c.phase === "on-duty" && c.isEarlyLeft && Boolean(c.actualStart),
  );

  return (
    <>
      <Card className="gap-3 px-5 py-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">
              Ростер хуанли
            </span>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1.5 text-center">
          {WEEK_HEADERS.map((d) => (
            <div
              key={d}
              className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground/70"
            >
              {d}
            </div>
          ))}
          {cells.map((cell, i) => (
            <CalendarCell
              key={cell ? cell.date : `pad-${i}`}
              cell={cell}
              onSelect={(d) => setSelectedDate(d)}
            />
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-[10px] text-muted-foreground">
          <LegendDot tone="day" label="Өдрийн ээлж" />
          <LegendDot tone="night" label="Шөнийн ээлж" />
          <LegendDot tone="rest" label="Амралт" />
          {hasLate && (
            <span className="inline-flex items-center gap-1 text-amber-700">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
              Хоцорсон
            </span>
          )}
          {hasEarly && (
            <span className="inline-flex items-center gap-1 text-amber-700">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
              Эрт тарсан
            </span>
          )}
          {hasArrival && (
            <span className="inline-flex items-center gap-1">
              <PlaneLanding className="h-3 w-3 text-emerald-600" />
              Уурхайд ирэх
            </span>
          )}
          {hasDeparture && (
            <span className="inline-flex items-center gap-1">
              <PlaneTakeoff className="h-3 w-3 text-cyan-600" />
              Буух
            </span>
          )}
        </div>
      </Card>

      <DayDrawer day={selected} onClose={() => setSelectedDate(null)} />
    </>
  );
}

function CalendarCell({
  cell,
  onSelect,
}: {
  cell: RosterCalendarDay | null;
  onSelect: (d: string) => void;
}) {
  if (!cell) {
    return <div className="aspect-square" />;
  }

  const isClickable =
    cell.phase === "on-duty" && Boolean(cell.actualStart || cell.actualEnd);

  let bg = "bg-muted/40";
  let dot = "bg-muted-foreground/30";
  let textTone = "text-muted-foreground";
  if (cell.phase === "on-duty") {
    if (cell.shiftType === "day") {
      bg = "bg-emerald-50";
      dot = "bg-emerald-500";
      textTone = "text-emerald-900";
    } else {
      bg = "bg-indigo-50";
      dot = "bg-indigo-500";
      textTone = "text-indigo-900";
    }
  }

  const isFlagged =
    cell.phase === "on-duty" &&
    (cell.isLate || cell.isEarlyLeft) &&
    Boolean(cell.actualStart);
  if (isFlagged) {
    bg = "bg-amber-50";
    dot = "bg-amber-500";
    textTone = "text-amber-900";
  }

  const Transition =
    cell.transition === "arrival"
      ? PlaneLanding
      : cell.transition === "departure"
        ? PlaneTakeoff
        : null;
  const transitionColor =
    cell.transition === "arrival" ? "text-emerald-600" : "text-cyan-600";

  const wrapperCls = cn(
    "relative flex aspect-square flex-col items-center justify-center rounded-md",
    bg,
    isFlagged && "ring-1 ring-amber-400/60",
    cell.isToday && "ring-2 ring-primary",
    isClickable && "cursor-pointer transition active:scale-95",
  );

  const content = (
    <>
      {Transition && (
        <Transition
          className={cn(
            "absolute right-0.5 top-0.5 h-2.5 w-2.5",
            transitionColor,
          )}
        />
      )}
      {isFlagged && (
        <AlertCircle className="absolute left-0.5 top-0.5 h-2.5 w-2.5 text-amber-600" />
      )}
      <span className={cn("text-xs font-semibold tabular-nums", textTone)}>
        {cell.dayOfMonth}
      </span>
      <span className={cn("mt-0.5 h-1.5 w-1.5 rounded-full", dot)} />
    </>
  );

  if (isClickable) {
    return (
      <button
        type="button"
        className={wrapperCls}
        onClick={() => onSelect(cell.date)}
      >
        {content}
      </button>
    );
  }
  return <div className={wrapperCls}>{content}</div>;
}

function LegendDot({
  tone,
  label,
}: {
  tone: "day" | "night" | "rest";
  label: string;
}) {
  const dot =
    tone === "day"
      ? "bg-emerald-500"
      : tone === "night"
        ? "bg-indigo-500"
        : "bg-muted-foreground/30";
  return (
    <span className="inline-flex items-center gap-1">
      <span className={cn("h-1.5 w-1.5 rounded-full", dot)} />
      {label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Bottom drawer — мобайл найрсаг detail view
// ─────────────────────────────────────────────────────────────────────

function DayDrawer({
  day,
  onClose,
}: {
  day: RosterCalendarDay | null;
  onClose: () => void;
}) {
  const open = day !== null;
  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-0 z-50 transition",
        open ? "pointer-events-auto" : "",
      )}
      aria-hidden={!open}
    >
      {/* Backdrop */}
      <div
        className={cn(
          "absolute inset-0 bg-black/40 transition-opacity duration-200",
          open ? "opacity-100" : "opacity-0",
        )}
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 mx-auto max-w-md rounded-t-2xl bg-card shadow-xl transition-transform duration-300 ease-out",
          open ? "translate-y-0" : "translate-y-full",
        )}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex justify-center pt-2">
          <span className="h-1 w-10 rounded-full bg-muted-foreground/30" />
        </div>
        {day && <DayDetailContent day={day} onClose={onClose} />}
      </div>
    </div>
  );
}

function DayDetailContent({
  day,
  onClose,
}: {
  day: RosterCalendarDay;
  onClose: () => void;
}) {
  const isLate = day.isLate ?? false;
  const isEarly = day.isEarlyLeft ?? false;
  const shiftLabel =
    day.shiftType === "day"
      ? "Өдрийн ээлж"
      : day.shiftType === "night"
        ? "Шөнийн ээлж"
        : "Ээлж";
  const worked = day.workedMinutes ?? null;

  return (
    <div className="px-5 pb-6 pt-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-base font-semibold text-foreground">
            {formatMonthDay(day.date)} · {day.dayLabel}
          </span>
          <Badge
            className={cn(
              "border-transparent",
              day.shiftType === "night"
                ? "bg-indigo-100 text-indigo-700"
                : "bg-emerald-100 text-emerald-700",
            )}
          >
            {shiftLabel}
          </Badge>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
          aria-label="Хаах"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {(isLate || isEarly) && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {isLate && (
            <Badge className="border-transparent bg-amber-100 text-amber-700">
              <AlertCircle className="mr-1 h-3 w-3" />
              Хоцорсон
            </Badge>
          )}
          {isEarly && (
            <Badge className="border-transparent bg-amber-100 text-amber-700">
              <AlertCircle className="mr-1 h-3 w-3" />
              Эрт тарсан
            </Badge>
          )}
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2">
        <DetailTile label="Эхлэх" value={formatTime(day.scheduledStart ?? null)} />
        <DetailTile label="Дуусах" value={formatTime(day.scheduledEnd ?? null)} />
        <DetailTile
          label="Нэвтэрсэн"
          value={formatTime(day.actualStart ?? null)}
          tone={isLate ? "warn" : "actual"}
        />
        <DetailTile
          label="Гарсан"
          value={formatTime(day.actualEnd ?? null)}
          tone={isEarly ? "warn" : "actual"}
        />
      </div>

      {worked != null && worked > 0 && (
        <div className="mt-3 flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
          <span className="text-xs text-muted-foreground">Нийт ажилласан</span>
          <span className="text-sm font-semibold tabular-nums text-foreground">
            {Math.floor(worked / 60)} цаг {worked % 60} мин
          </span>
        </div>
      )}
    </div>
  );
}

function DetailTile({
  label,
  value,
  tone = "scheduled",
}: {
  label: string;
  value: string | null;
  tone?: "scheduled" | "actual" | "warn";
}) {
  const tileBg =
    tone === "warn"
      ? "bg-amber-50"
      : tone === "actual"
        ? "bg-emerald-50/60"
        : "bg-muted/60";
  const valueTone = tone === "warn" ? "text-amber-700" : "text-foreground";
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-0.5 rounded-xl py-3",
        tileBg,
      )}
    >
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className={cn("text-xl font-bold tabular-nums", valueTone)}>
        {value ?? "—"}
      </span>
    </div>
  );
}
