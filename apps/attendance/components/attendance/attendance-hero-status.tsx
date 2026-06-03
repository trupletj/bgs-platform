"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, BedDouble, Moon, Sun } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  formatMonth,
  formatTime,
  getDayName,
} from "@/lib/format-attendance";
import {
  formatMonthDay,
  getDutyStateVisual,
} from "@/lib/roster-helpers";
import type { RosterCycle, TodayShift } from "@/types/attendance";

interface Props {
  today: TodayShift;
  cycle: RosterCycle;
}

const DAY_OF_WEEK_FULL: Record<string, string> = {
  Ня: "Ням",
  Да: "Даваа",
  Мя: "Мягмар",
  Лх: "Лхагва",
  Пү: "Пүрэв",
  Ба: "Баасан",
  Бя: "Бямба",
};

function formatTodayLong(): string {
  const now = new Date();
  const dayShort = getDayName(now.toISOString().slice(0, 10));
  const dayFull = DAY_OF_WEEK_FULL[dayShort] ?? dayShort;
  return `${formatMonth(now)} ${now.getDate()}, ${dayFull}`;
}

function formatClock(now: Date) {
  const h = now.getHours().toString().padStart(2, "0");
  const m = now.getMinutes().toString().padStart(2, "0");
  const s = now.getSeconds().toString().padStart(2, "0");
  return { hm: `${h}:${m}`, sec: s };
}

function durationLabel(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h} цаг ${m} минут`;
}

export function AttendanceHeroStatus({ today, cycle }: Props) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const clock = now ? formatClock(now) : { hm: "--:--", sec: "--" };
  const visual = getDutyStateVisual(today.state);
  const dateLine = useMemo(() => formatTodayLong(), []);

  if (today.type === null) {
    return <RestingHero cycle={cycle} clock={clock} dateLine={dateLine} />;
  }

  const Icon = today.type === "day" ? Sun : Moon;
  const accent =
    today.type === "day" ? "text-amber-600" : "text-indigo-600";
  const iconBg =
    today.type === "day" ? "bg-amber-50" : "bg-indigo-50";

  const startMs = today.scheduledStart
    ? new Date(today.scheduledStart).getTime()
    : null;
  const endMs = today.scheduledEnd
    ? new Date(today.scheduledEnd).getTime()
    : null;
  const nowMs = now ? now.getTime() : null;
  let progressPct = 0;
  if (startMs && endMs && nowMs) {
    progressPct = Math.max(
      0,
      Math.min(100, ((nowMs - startMs) / (endMs - startMs)) * 100),
    );
  }

  let workedDisplay: string | null = null;
  if (today.workedMinutes != null) {
    workedDisplay = `${durationLabel(today.workedMinutes)} ажиллаа`;
  } else if (today.actualStart && !today.actualEnd && now) {
    const diff = Math.floor(
      (now.getTime() - new Date(today.actualStart).getTime()) / 60000,
    );
    if (diff > 0) {
      workedDisplay = `${durationLabel(diff)} ажиллаж байна`;
    }
  }

  const isLate = today.state === "late";
  const isEarly = today.state === "early-left";
  const isAbsent = today.state === "absent";
  const actualStartText = isAbsent ? null : formatTime(today.actualStart);
  const actualEndText = isAbsent ? null : formatTime(today.actualEnd);

  return (
    <Card className="gap-4 px-5 py-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full",
              iconBg,
            )}
          >
            <Icon className={cn("h-4 w-4", accent)} />
          </span>
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {today.label}
          </span>
        </div>
        <Badge className={cn(visual.badgeClass)}>{visual.label}</Badge>
      </div>

      <p className="text-xs text-muted-foreground">{dateLine}</p>

      <div className="flex flex-col items-center gap-0.5 py-1">
        <div className="flex items-baseline gap-1">
          <span className="text-5xl font-bold tabular-nums tracking-tight text-foreground">
            {clock.hm}
          </span>
          <span className="text-lg font-semibold tabular-nums text-muted-foreground">
            :{clock.sec}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">Одоогийн цаг</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <TimeTile
          label="Ээлж эхэлнэ"
          time={formatTime(today.scheduledStart)}
          tone="scheduled"
        />
        <TimeTile
          label="Ээлж дуусна"
          time={formatTime(today.scheduledEnd)}
          tone="scheduled"
        />
        <TimeTile
          label="Нэвтэрсэн"
          time={actualStartText}
          tone={isLate ? "warn" : "actual"}
          hint={isLate ? "Хоцорсон" : null}
        />
        <TimeTile
          label="Гарсан"
          time={actualEndText}
          tone={isEarly ? "warn" : "actual"}
          hint={isEarly ? "Эрт тарсан" : null}
        />
      </div>

      <div className="space-y-1">
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              today.type === "day" ? "bg-emerald-500" : "bg-indigo-500",
            )}
            style={{ width: `${progressPct}%` }}
          />
        </div>
        {workedDisplay && (
          <p className="text-xs text-muted-foreground">{workedDisplay}</p>
        )}
      </div>
    </Card>
  );
}

interface TimeTileProps {
  label: string;
  time: string | null;
  tone: "scheduled" | "actual" | "warn";
  hint?: string | null;
}

function TimeTile({ label, time, tone, hint }: TimeTileProps) {
  const tileClass =
    tone === "scheduled"
      ? "bg-muted/60"
      : tone === "warn"
        ? "bg-amber-50"
        : "bg-emerald-50/50";
  const valueClass =
    tone === "warn" ? "text-amber-700" : "text-foreground";
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-0.5 rounded-xl py-3",
        tileClass,
      )}
    >
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className={cn("text-xl font-bold tabular-nums", valueClass)}>
        {time ?? "—"}
      </span>
      {hint && (
        <span className="flex items-center gap-1 text-[10px] font-medium text-amber-700">
          <AlertCircle className="h-3 w-3" />
          {hint}
        </span>
      )}
    </div>
  );
}

function RestingHero({
  cycle,
  clock,
  dateLine,
}: {
  cycle: RosterCycle;
  clock: { hm: string; sec: string };
  dateLine: string;
}) {
  const visual = getDutyStateVisual("resting");
  const phaseLength = 14;
  const restProgress = Math.min(
    100,
    Math.max(0, (cycle.daysIntoPhase / phaseLength) * 100),
  );
  return (
    <Card className="gap-4 px-5 py-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-50">
            <BedDouble className="h-4 w-4 text-cyan-600" />
          </span>
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Амралт
          </span>
        </div>
        <Badge className={cn(visual.badgeClass)}>{visual.label}</Badge>
      </div>

      <p className="text-xs text-muted-foreground">{dateLine}</p>

      <div className="flex flex-col items-center gap-0.5 py-2">
        <span className="text-5xl font-bold tabular-nums tracking-tight text-foreground">
          {cycle.daysRemainingPhase}
        </span>
        <span className="text-xs text-muted-foreground">
          хоногийн дараа ажил эхэлнэ
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <TimeTile
          label="Амралт эхэлсэн"
          time={formatMonthDay(cycle.phaseStart)}
          tone="scheduled"
        />
        <TimeTile
          label="Ажил эхэлнэ"
          time={formatMonthDay(cycle.nextPhaseStart)}
          tone="scheduled"
        />
      </div>

      <div className="space-y-1">
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-cyan-500 transition-all duration-500"
            style={{ width: `${restProgress}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Амралтын {cycle.daysIntoPhase} / {phaseLength} дэх өдөр
          <span className="ml-2 text-muted-foreground/70">
            (одоогийн цаг {clock.hm})
          </span>
        </p>
      </div>
    </Card>
  );
}
