import { AlertTriangle } from "lucide-react";
import { getMyAttendanceOverview } from "@/actions/attendance";
import { AttendanceKpiCards } from "@/components/attendance/attendance-kpi-cards";
import { AttendanceTodayClock } from "@/components/attendance/attendance-today-clock";
import { AttendanceWeekOverviewCard } from "@/components/attendance/attendance-week-overview";

// Cookie дамжуулагдсаны дараа л RSC шинээр fetch хийх ёстой тул
// статик prerender хийхгүй.
export const dynamic = "force-dynamic";

export default async function AttendancePage() {
  const overview = await getMyAttendanceOverview();

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground/60">
          Ирц
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
          {overview.kpi.scopeLabel}
        </h1>
      </div>

      <AttendanceKpiCards kpi={overview.kpi} />

      {!overview.hasBteg ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-card py-16 text-center">
          <AlertTriangle className="h-8 w-8 text-muted-foreground/50" />
          <p className="font-semibold text-foreground">
            Цаг бүртгэлийн мэдээлэл байхгүй
          </p>
          <p className="text-sm text-muted-foreground">
            Утасны дугаар нь intranet системд бүртгэлгүй эсвэл бүртгэл хоосон
            байна
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-1">
            {overview.today && (
              <AttendanceTodayClock
                today={overview.today}
                monthLabel={overview.kpi.scopeLabel}
              />
            )}
          </div>
          <div className="lg:col-span-2">
            <AttendanceWeekOverviewCard week={overview.week} />
          </div>
        </div>
      )}
    </div>
  );
}
