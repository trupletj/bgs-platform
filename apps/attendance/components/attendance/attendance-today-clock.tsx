"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import { formatTime } from "@/lib/format-attendance";
import type { AttendanceTodaySnapshot } from "@/types/attendance";

interface AttendanceTodayClockProps {
  today: AttendanceTodaySnapshot;
  monthLabel: string; // "2026 он, 5-р сар"
}

function formatClock(now: Date): { hm: string; sec: string } {
  const h = now.getHours().toString().padStart(2, "0");
  const m = now.getMinutes().toString().padStart(2, "0");
  const s = now.getSeconds().toString().padStart(2, "0");
  return { hm: `${h}:${m}`, sec: s };
}

function statusBadge(today: AttendanceTodaySnapshot) {
  if (today.workEndAt) {
    return (
      <Badge className="border-transparent bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
        Гарсан
      </Badge>
    );
  }
  if (today.workStartAt) {
    return (
      <Badge className="border-transparent bg-indigo-100 text-indigo-700 hover:bg-indigo-100">
        Идэвхтэй
      </Badge>
    );
  }
  return (
    <Badge className="border-transparent bg-muted text-muted-foreground hover:bg-muted">
      Бүртгэгдээгүй
    </Badge>
  );
}

export function AttendanceTodayClock({
  today,
  monthLabel,
}: AttendanceTodayClockProps) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const { hm, sec } = now
    ? formatClock(now)
    : { hm: "--:--", sec: "--" };

  return (
    <Card className="flex flex-col gap-4 px-6 py-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">
            Өнөөдрийн ирц
          </span>
        </div>
        {statusBadge(today)}
      </div>

      <p className="text-xs text-muted-foreground">
        {monthLabel}, {today.dayLabel}
      </p>

      <div className="flex flex-col items-center gap-1 py-2">
        <div className="flex items-baseline gap-1">
          <span className="text-5xl font-bold tabular-nums tracking-tight text-foreground">
            {hm}
          </span>
          <span className="text-xl font-semibold tabular-nums text-muted-foreground">
            :{sec}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">Одоогийн цаг</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col items-center gap-1 rounded-xl bg-muted/60 py-3">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Нэвтрэх цаг
          </span>
          <span className="text-2xl font-bold tabular-nums text-foreground">
            {formatTime(today.workStartAt) ?? "—"}
          </span>
          <span className="text-[10px] text-muted-foreground">Цагтаа</span>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-xl bg-muted/60 py-3">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Гарах цаг
          </span>
          <span className="text-2xl font-bold tabular-nums text-foreground">
            {formatTime(today.workEndAt) ?? "—"}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {today.workEndAt ? "Гарсан" : "—"}
          </span>
        </div>
      </div>

      {today.workDuration != null && (
        <div className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2">
          <span className="text-xs text-muted-foreground">
            Нийт ажлын цаг
          </span>
          <span className="text-sm font-semibold tabular-nums text-foreground">
            {Math.floor(today.workDuration / 60)} цаг{" "}
            {today.workDuration % 60} мин
          </span>
        </div>
      )}
    </Card>
  );
}
