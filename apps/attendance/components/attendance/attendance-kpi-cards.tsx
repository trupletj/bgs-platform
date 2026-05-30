import { Card } from "@/components/ui/card";
import { Calendar, Clock, Medal } from "lucide-react";
import { formatDuration } from "@/lib/format-attendance";
import type { AttendanceKpiSummary } from "@/types/attendance";

interface KpiTileProps {
  label: string;
  value: string;
  Icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
}

function KpiTile({ label, value, Icon, iconBg, iconColor }: KpiTileProps) {
  return (
    <Card className="flex flex-row items-center gap-3 px-4 py-3">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-full ${iconBg}`}
      >
        <Icon className={`h-5 w-5 ${iconColor}`} />
      </div>
      <div className="flex flex-col">
        <span className="text-2xl font-bold tabular-nums text-foreground leading-tight">
          {value}
        </span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
    </Card>
  );
}

export function AttendanceKpiCards({ kpi }: { kpi: AttendanceKpiSummary }) {
  const totalHoursValue =
    kpi.totalMinutes > 0
      ? `${Math.floor(kpi.totalMinutes / 60)} цаг`
      : "0 цаг";
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <KpiTile
        label="Нийт ажилсан өдөр"
        value={`${kpi.workedDays} өдөр`}
        Icon={Calendar}
        iconBg="bg-indigo-50"
        iconColor="text-indigo-600"
      />
      <KpiTile
        label="Нийт ажилсан цаг"
        value={totalHoursValue}
        Icon={Clock}
        iconBg="bg-emerald-50"
        iconColor="text-emerald-600"
      />
      <KpiTile
        label="Ирцийн хувь"
        value={`${kpi.attendancePercent}%`}
        Icon={Medal}
        iconBg="bg-amber-50"
        iconColor="text-amber-600"
      />
    </div>
  );
}

export { formatDuration };
