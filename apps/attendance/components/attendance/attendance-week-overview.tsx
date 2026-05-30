import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTime } from "@/lib/format-attendance";
import type {
  AttendanceDayStatus,
  AttendanceWeekOverview,
} from "@/types/attendance";

interface StatusVisual {
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  badgeClass: string;
  bg: string;
  border: string;
}

const STATUS_VISUAL: Record<AttendanceDayStatus, StatusVisual> = {
  present: {
    label: "Ирсэн",
    Icon: CheckCircle2,
    badgeClass: "border-transparent bg-emerald-100 text-emerald-700",
    bg: "bg-emerald-50/50",
    border: "border-emerald-200",
  },
  late: {
    label: "Хоцорсон",
    Icon: AlertCircle,
    badgeClass: "border-transparent bg-amber-100 text-amber-700",
    bg: "bg-amber-50/60",
    border: "border-amber-200",
  },
  "early-left": {
    label: "Эрт тарсан",
    Icon: AlertCircle,
    badgeClass: "border-transparent bg-amber-100 text-amber-700",
    bg: "bg-amber-50/60",
    border: "border-amber-200",
  },
  absent: {
    label: "Тасалсан",
    Icon: XCircle,
    badgeClass: "border-transparent bg-rose-100 text-rose-700",
    bg: "bg-rose-50/40",
    border: "border-rose-200",
  },
  today: {
    label: "Өнөөдөр",
    Icon: CheckCircle2,
    badgeClass: "border-transparent bg-indigo-100 text-indigo-700",
    bg: "bg-indigo-50/40",
    border: "border-indigo-300",
  },
  future: {
    label: "—",
    Icon: Calendar,
    badgeClass: "border-transparent bg-muted text-muted-foreground",
    bg: "bg-card",
    border: "border-border",
  },
  weekend: {
    label: "Амралт",
    Icon: Calendar,
    badgeClass: "border-transparent bg-muted text-muted-foreground",
    bg: "bg-card",
    border: "border-border",
  },
};

function DurationLabel({ minutes }: { minutes: number | null }) {
  if (!minutes || minutes <= 0) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return (
    <span className="text-xs text-primary/80">
      {h}ц {m}м
    </span>
  );
}

export function AttendanceWeekOverviewCard({
  week,
}: {
  week: AttendanceWeekOverview;
}) {
  const totalH = Math.floor(week.summary.totalMinutes / 60);
  const totalM = week.summary.totalMinutes % 60;
  return (
    <Card className="flex flex-col gap-4 px-5 py-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">
            Энэ долоо хоногийн ирц
          </span>
        </div>
        <span className="text-xs text-muted-foreground">{week.weekLabel}</span>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <SummaryTile
          value={week.summary.presentDays}
          label="Ирсэн"
          accent="bg-emerald-50 text-emerald-700"
        />
        <SummaryTile
          value={week.summary.absentDays}
          label="Тасалсан"
          accent="bg-rose-50 text-rose-700"
        />
        <SummaryTile
          value={week.summary.lateDays}
          label="Хоцорсон"
          accent="bg-amber-50 text-amber-700"
        />
        <SummaryTile
          value={
            week.summary.totalMinutes > 0
              ? `${totalH}ц ${totalM}м`
              : "0ц 0м"
          }
          label="Нийт цаг"
          accent="bg-indigo-50 text-indigo-700"
        />
      </div>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-7">
        {week.days.map((d) => {
          const v = STATUS_VISUAL[d.status];
          const Icon = v.Icon;
          return (
            <div
              key={d.dayDate}
              className={cn(
                "flex flex-col items-center gap-2 rounded-xl border px-2 py-3",
                v.bg,
                v.border,
                d.isToday && "ring-2 ring-primary",
              )}
            >
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {d.dayLabel}
              </span>
              <span className="text-xl font-bold tabular-nums text-foreground">
                {d.dayOfMonth}
              </span>
              <Badge className={cn("gap-1", v.badgeClass)}>
                <Icon className="h-3 w-3" />
                {d.isToday ? "Өнөөдөр" : v.label}
              </Badge>
              {(d.workStartAt || d.workEndAt) && (
                <div className="flex flex-col items-center gap-0.5 text-[10px] text-muted-foreground">
                  <span className="tabular-nums">
                    Ирсэн{" "}
                    <span className="font-semibold text-foreground">
                      {formatTime(d.workStartAt) ?? "—"}
                    </span>
                  </span>
                  <span className="tabular-nums">
                    Гарсан{" "}
                    <span className="font-semibold text-foreground">
                      {formatTime(d.workEndAt) ?? "—"}
                    </span>
                  </span>
                  <DurationLabel minutes={d.workDuration} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function SummaryTile({
  value,
  label,
  accent,
}: {
  value: number | string;
  label: string;
  accent: string;
}) {
  return (
    <div className={cn("flex flex-col items-center rounded-xl py-2", accent)}>
      <span className="text-xl font-bold tabular-nums">{value}</span>
      <span className="text-[10px] uppercase tracking-wide opacity-80">
        {label}
      </span>
    </div>
  );
}
