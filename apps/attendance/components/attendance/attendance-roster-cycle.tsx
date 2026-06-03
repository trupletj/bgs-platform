import { RefreshCcw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  formatMonthDay,
  getRotationLabel,
} from "@/lib/roster-helpers";
import type { RosterCycle } from "@/types/attendance";

export function AttendanceRosterCycle({ cycle }: { cycle: RosterCycle }) {
  const isOnDuty = cycle.phase === "on-duty";
  const phaseLabel = isOnDuty ? "Уурхай дээр" : "Амралтад";
  const progressPct = (cycle.daysIntoPhase / 14) * 100;

  // day-then-night үед on-duty фазад дотоод сегмент үзүүлнэ
  const showSubsegment = isOnDuty && cycle.pattern === "day-then-night";
  // Cycle day 1-7 = өдөр, 8-14 = шөнө. Шилжих цэг = 50% дотор.

  return (
    <Card className="gap-3 px-5 py-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <RefreshCcw className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">
            Ажлын тойрог
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          {getRotationLabel(cycle.pattern)}
        </span>
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-foreground">
          {phaseLabel}
        </span>
        <span className="text-xs tabular-nums text-muted-foreground">
          {cycle.daysIntoPhase} / 14 өдөр
        </span>
      </div>

      <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            isOnDuty ? "bg-emerald-500" : "bg-cyan-500",
          )}
          style={{ width: `${progressPct}%` }}
        />
        {showSubsegment && (
          <span
            className="absolute top-0 h-full w-px bg-foreground/40"
            style={{ left: "50%" }}
            aria-hidden
          />
        )}
      </div>

      {showSubsegment && (
        <p className="text-[10px] text-muted-foreground">
          Дунд зурвас: өдрийн ээлж (1–7) → шөнийн ээлж (8–14)
        </p>
      )}

      <div className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2">
        <span className="text-xs text-muted-foreground">
          {cycle.nextPhaseLabel}
        </span>
        <span className="text-xs font-semibold tabular-nums text-foreground">
          {cycle.daysRemainingPhase === 0
            ? "Маргааш"
            : `${cycle.daysRemainingPhase} хоногийн дараа`}
          <span className="ml-1 text-muted-foreground">
            ({formatMonthDay(cycle.nextPhaseStart)})
          </span>
        </span>
      </div>
    </Card>
  );
}
