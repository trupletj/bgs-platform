import { getCurrentWorkerProfile } from "@/actions/profile";
import { getMyRosterOverview } from "@/actions/roster";
import { AttendanceHeader } from "@/components/attendance/attendance-header";
import { AttendanceHeroStatus } from "@/components/attendance/attendance-hero-status";
import { AttendanceRosterCycle } from "@/components/attendance/attendance-roster-cycle";
import { AttendanceRosterCalendar } from "@/components/attendance/attendance-roster-calendar";
import { ScenarioSwitcher } from "@/components/attendance/scenario-switcher";
import {
  getDummyRosterStatus,
  type ScenarioKey,
} from "@/lib/dummy-attendance";
import type { RosterStatusOverview } from "@/types/attendance";

export const dynamic = "force-dynamic";

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ scenario?: string }>;
}) {
  const { scenario } = await searchParams;

  // Dev mode: scenario query → force dummy
  if (scenario) {
    const { scenario: active, overview } = getDummyRosterStatus(scenario);
    return renderPage(overview, active);
  }

  // Жинхэнэ RPC + profile зэрэг
  const [real, profile] = await Promise.all([
    getMyRosterOverview(),
    getCurrentWorkerProfile(),
  ]);

  if (real) {
    return renderPage(real, undefined);
  }

  // Session байхгүй / дата хоосон → dummy + profile fallback
  const dummy = getDummyRosterStatus(undefined);
  const overview: RosterStatusOverview = {
    ...dummy.overview,
    worker: profile ?? dummy.overview.worker,
  };
  return renderPage(overview, dummy.scenario);
}

function renderPage(
  overview: RosterStatusOverview,
  activeScenario: ScenarioKey | undefined,
) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 p-4">
      <AttendanceHeader worker={overview.worker} />
      <AttendanceHeroStatus today={overview.today} cycle={overview.cycle} />
      <AttendanceRosterCycle cycle={overview.cycle} />
      <AttendanceRosterCalendar calendar={overview.calendar} />
      {activeScenario !== undefined && (
        <ScenarioSwitcher current={activeScenario} />
      )}
    </div>
  );
}
